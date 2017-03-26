#!/bin/bash
set -e

# Auto-Deploy Pull Request

# If this isn't a pull request, abort.
if [ "${TRAVIS_EVENT_TYPE}" != "pull_request" ]; then
  echo "This only runs on pull_request events. Event was $TRAVIS_EVENT_TYPE."
  exit
fi

# If there were build failures, abort
if [ "${TRAVIS_TEST_RESULT}" = "1" ]; then
  echo "Deploy aborted, there were build/test failures."
  exit
fi

./travis/install_google_cloud_sdk.sh

# Set the AppEngine version for staging
VERSION=pr-$TRAVIS_PULL_REQUEST

# Determine staging URL based on PR.
export STAGING_URL=https://$VERSION-dot-$GAE_APP_ID.appspot.com
echo "Pull Request: $TRAVIS_PULL_REQUEST will be staged at $STAGING_URL"

# Deploy to AppEngine
$HOME/google-cloud-sdk/bin/gcloud app deploy app.yaml -q --no-promote --version $VERSION

# If App Engine deploy was successful, run Lighthouse.
if [ $? -eq 0 ]; then
  # node travis/runLighthouse.js $STAGING_URL
  node travis/runLighthouse.js
# else
  # node travis/updateGithubStatus.js failure $STAGING_URL
fi
