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
const minimist = require('minimist');

const CI_HOST = process.env.CI_HOST || 'https://lighthouse-ci.appspot.com';
const API_KEY = process.env.API_KEY;
const RUNNERS = {chrome: 'chrome', wpt: 'wpt', comment: 'comment'};

function printUsageAndExit() {
  console.log(`usage: runLighthouse.js --score=<score> [--runner=${Object.keys(RUNNERS)}] <url>`);
  console.log('example: runLighthouse.js --score=96 https://example.com');
  process.exit(1);
}

function getConfig() {
  const args = process.argv.slice(2);
  const argv = minimist(args);
  const flags = {};

  flags.testUrl = argv._[0];
  if (!flags.testUrl) {
    console.log(chalk.red('Please provide a url to test.'));
    printUsageAndExit();
  }

  flags.minPassScore = Number(argv['min-score']);
  if (!flags.minPassScore) {
    console.log(chalk.red('Please provide minimum "passing" Lighthouse score.'));
    printUsageAndExit();
  }

  flags.runner = argv['runner'] || RUNNERS.chrome;
  const possibleRunners = Object.keys(RUNNERS);
  if (!possibleRunners.includes(flags.runner)) {
    console.log(chalk.red(`Unknown runner "${flags.runner}". Options: ${possibleRunners}`));
    printUsageAndExit();
  }
  console.log(chalk.yellow(`Using runner: ${flags.runner}`));

  flags.pr = {
    number: parseInt(process.env.TRAVIS_PULL_REQUEST, 10),
    sha: process.env.TRAVIS_PULL_REQUEST_SHA,
  };

  const repoSlug = process.env.TRAVIS_PULL_REQUEST_SLUG;
  flags.repo = {
    owner: repoSlug.split('/')[0],
    name: repoSlug.split('/')[1]
  };

  return flags;
}

/**
 * @param {!Object} Config settings to run the Lighthouse CI.
 */
function run(config) {
  let endpoint;
  let body = JSON.stringify(config);

  switch (runner) {
    case RUNNERS.wpt:
      endpoint = `${CI_HOST}/run_on_wpt`;
      break;
    case RUNNERS.comment:
      endpoint = `${CI_HOST}/add_github_comment`;
      break;
    case RUNNERS.chrome: // same as default
    default:
      endpoint = `${CI_HOST}/run_on_chrome`;
      body = JSON.stringify(Object.assign({format: 'json'}, config));
  }

  fetch(endpoint, {
    method: 'POST',
    body,
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': API_KEY // Keep usage tight for now.
    }
  })
  .then(resp => resp.json())
  .then(json => {
    if (runner === RUNNERS.wpt) {
      console.log(chalk.green(
          `Started Lighthouse run on WebPageTest: ${json.data.target_url}`));
      return;
    }

    let colorize = chalk.green;
    if (json.score < config.minPassScore) {
      colorize = chalk.red;
    }
    console.log(colorize('Lighthouse CI score:'), json.score);
  })
  .catch(err => {
    console.log(chalk.red('Lighthouse CI failed'), err);
    process.exit(1);
  });
}

// Run LH if this is a PR.
const config = getConfig();
if (process.env.TRAVIS_EVENT_TYPE === 'pull_request') {
  run(config);
} else {
  console.log('Lighthouse is not run for non-PR commits.');
}
