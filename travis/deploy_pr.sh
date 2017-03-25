#!/bin/bash
set -e

# Auto-Deploy Pull Request

# If there no githug oauth otken, abort.
if [ -z "${GITHUB_OAUTH_TOKEN}" ]; then
 echo "Github OAuth token not available."
 exit
fi

# If this isn't a pull request, abort.
if [ "${TRAVIS_EVENT_TYPE}" != "pull_request" ]; then
  echo "This only runs on pull_request events. Event was $TRAVIS_EVENT_TYPE"
  exit
fi

# If there were build failures, abort
if [ "${TRAVIS_TEST_RESULT}" = "1" ]; then
  echo "Deploy aborted, there were build/test failures."
  exit
fi

# Set the AppEngine version for staging
VERSION=pr-$TRAVIS_PULL_REQUEST

# Show the final staged URL
STAGED_URL=https://$VERSION-dot-$GAE_APP_ID.appspot.com
echo Pull Request: $TRAVIS_PULL_REQUEST will be staged at $STAGED_URL

# Deploy to AppEngine
$HOME/google-cloud-sdk/bin/gcloud app deploy app.yaml -q --no-promote --version $VERSION

# if [ $? -eq 0 ]; then
#   node travis/updateGithubStatus.js pending $STAGED_URL
# else
#   node travis/updateGithubStatus.js failure $STAGED_URL
# fi
