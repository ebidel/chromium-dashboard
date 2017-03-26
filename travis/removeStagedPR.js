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

const exec = require('child_process').exec;
const chalk = require('chalk');

const GCLOUD_CMD = `${process.env.HOME}/google-cloud-sdk/bin/gcloud`;

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

exports.removeStagedPR = removeStagedPR;
