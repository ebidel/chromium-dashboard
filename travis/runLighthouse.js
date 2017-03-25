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

const chalk = require('chalk');
const fetch = require('node-fetch'); // polyfill
const exec = require('child_process').exec;
const updateGithubStatus = require('./updateGithubStatus.js').updateGithubStatus;

// fetch('https://88a825eb.ngrok.io/github_status', {
//   method: 'POST',
//   body: JSON.stringify({foo: 5})
// })
// .then(resp => resp.json())
// .then(resp => {
//   console.log(json)
// });
// return;

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

const GCLOUD_CMD = `${process.env.HOME}/google-cloud-sdk/bin/gcloud`;
const PR_NUM = parseInt(process.env.TRAVIS_PULL_REQUEST);

function removeStagedPR(prNum) {
  return new Promise((resolve, reject) => {
    const cmd = `${GCLOUD_CMD} app versions delete pr-${prNum}`;
    exec(cmd, (err, stdout, stderr) => {
      // stdout = stdout.trim();
      // stderr = stderr.trim();
      if (err) {
        console.log(cmd, chalk.red('FAILED'));
        reject(err);
        return;
      }
      console.log(chalk.cyan(stdout));
      resolve(stdout);
    });
  });
}

const args = process.argv.slice(2);
const stageUrl = args[0];
const minPassScore = Number(process.env.LH_MIN_PASS_SCORE);

updateGithubStatus('pending', stageUrl)
  .then(status => testOnHeadlessChrome(stageUrl))
  .then(score => {
    if (score < minPassScore) {
      console.log('Lighthouse score:', chalk.red(score));
      return updateGithubStatus('failure', stageUrl, score, minPassScore);
      process.exit(1);
    }

    console.log('Lighthouse score:', chalk.green(score));
    return updateGithubStatus('success', stageUrl, score);
  })
  .then(status => removeStagedPR(PR_NUM))
  .catch(err => {
    return updateGithubStatus('error');
  });
