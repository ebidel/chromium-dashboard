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
// const exec = require('child_process').exec;
// const updateGithubStatus = require('./updateGithubStatus.js').updateGithubStatus;

// function removeStagedPR(prNum) {
//   return new Promise((resolve, reject) => {
//     const GCLOUD_CMD = `${process.env.HOME}/google-cloud-sdk/bin/gcloud`;
//     const cmd = `${GCLOUD_CMD} app versions delete pr-${prNum}`;
//     exec(cmd, (err, stdout, stderr) => {
//       // stdout = stdout.trim();
//       // stderr = stderr.trim();
//       if (err) {
//         console.log(cmd, chalk.red('FAILED'));
//         reject(err);
//         return;
//       }
//       console.log(chalk.cyan(stdout));
//       resolve(stdout);
//     });
//   });
// }

// const LH_CI_ENDPOINT = 'https://lighthouse-ci.appspot.com/github_status';
const LH_CI_ENDPOINT = 'http://88a825eb.ngrok.io/github_status';

// const args = process.argv.slice(2);
// const STAGING_URL = args[0];
const STAGING_URL = process.env.STAGING_URL;
const LH_MIN_PASS_SCORE = process.env.LH_MIN_PASS_SCORE;
const PR_NUM = process.env.TRAVIS_PULL_REQUEST;
const PR_SHA = process.env.TRAVIS_PULL_REQUEST_SHA;
const REPO_SLUG = process.env.TRAVIS_PULL_REQUEST_SLUG;

// function run() {
//   updateGithubStatus('pending', stageUrl)
//     .then(status => testOnHeadlessChrome(stageUrl))
//     .then(score => {
//       if (score < minPassScore) {
//         console.log('Lighthouse score:', chalk.red(score));
//         return updateGithubStatus('failure', stageUrl, score, minPassScore);
//         process.exit(1);
//       }

//       console.log('Lighthouse score:', chalk.green(score));
//       return updateGithubStatus('success', stageUrl, score);
//     })
//     .then(status => removeStagedPR(PR_NUM))
//     .catch(err => {
//       return updateGithubStatus('error');
//     });
// }

function run() {
  const data = {
    stagingUrl: STAGING_URL,
    minPassScore: Number(LH_MIN_PASS_SCORE),
    repo: {
      owner: REPO_SLUG.split('/')[0],
      name: REPO_SLUG.split('/')[1]
    },
    pr: {
      number: parseInt(PR_NUM),
      sha: PR_SHA
    }
  };

  fetch(LH_CI_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {'Content-Type': 'application/json'}
  }).catch(err => {
    process.exit(1);
  });
}

run();
