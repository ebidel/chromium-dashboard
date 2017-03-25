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

/**
 * @fileoverview
 * Updates a PR's Status based on success/failure.
 */

const chalk = require('chalk');
const Github = require('github');

console.log('Git Build Status Updater');

const GAE_APP_ID = process.env.GAE_APP_ID;
const REPO_SLUG = process.env.TRAVIS_REPO_SLUG.split('/');
const REPO_OWNER = REPO_SLUG[0];
const REPO_NAME = REPO_SLUG[1];
const OAUTH_TOKEN = process.env.GITHUB_OAUTH_TOKEN;
const PR_SHA = process.env.TRAVIS_PULL_REQUEST_SHA;

const MIN_PASS_SCORE = Number(process.env.LH_MIN_PASS_SCORE);

if (!OAUTH_TOKEN) {
  console.error('Github OAuth token not available');
  process.exit(0);
}

const github = new Github({debug: false, Promise: Promise});
github.authenticate({type: 'oauth', token: OAUTH_TOKEN}); // lighthousebot creds

const args = process.argv.slice(2);
const status = args[0];
const targetUrl = args[1];
const score = args[2];

console.log(status, targetUrl, score)

const opts = {
  owner: REPO_OWNER,
  repo: REPO_NAME,
  sha: PR_SHA,
  context: 'Lighthouse',
  state: status,
  target_url: targetUrl
};

switch (status) {
  case 'pending':
    opts.description = `Auditing these PR changes on ${targetUrl}...`;
    break;
  case 'success':
    opts.description = `Auditing complete. New Lighthouse score: ${score}`;
  case 'failure':
    opts.description = `Auditing complete. New Lighthouse score: ${score}. Required: > ${MIN_PASS_SCORE}`;
    break;
  default:
    // noop
}

console.log('State:', chalk.cyan(opts.state));

github.repos.createStatus(opts)
  .then(status => {
    console.log('PR status updated.');
  })
  .catch(err => {
    console.log(chalk.red('ERROR'), 'unable to set PR status:', err);
  });
