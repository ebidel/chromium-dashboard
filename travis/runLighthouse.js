/**
 * Copyright 2017 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

const fetch = require('node-fetch'); // polyfill

/**
 * Calculates an overall score across all sub audits.
 * @param {!Object} lhResults Lighthouse results object.
 * @return {!number}
 */
function getOverallScore(lhResults) {
  const scoredAggregations = lhResults.aggregations.filter(a => a.scored);
  const total = scoredAggregations.reduce((sum, aggregation) => {
    return sum + aggregation.total;
  }, 0);
  return Math.round((total / scoredAggregations.length) * 100);
}

function testOnHeadlessChrome(testUrl) {
  const builderUrl = 'https://builder-dot-lighthouse-ci.appspot.com/ci' +
                      `?format=json&url=${testUrl}`;
  return fetch(builderUrl)
    .then(resp => resp.json())
    .then(lhResults => {
      return getOverallScore(lhResults);
    }).catch(err => {
      throw err;
    });
}

const args = process.argv.slice(2);
const stageUrl = args[0];
const minPassScore = Number(args[1]);

testOnHeadlessChrome(stageUrl).then(score => {
  process.env.LH_SCORE = score;
  if (score >= minPassScore) {
    console.log(`Lighthouse score: ${score}`)
    process.exit(0);
    return;
  }
  process.exit(1);
});
