![Logo](./docs/assets/banner_migrator.png)

# Swaptoshi Migrator

Swaptoshi Migrator is a command line tool to migrate the blockchain data to the latest protocol when hard fork.

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](http://www.apache.org/licenses/LICENSE-2.0)
![GitHub tag (latest by date)](https://img.shields.io/github/v/tag/swaptoshi/swaptoshi-migrator)
![GitHub repo size](https://img.shields.io/github/repo-size/swaptoshi/swaptoshi-migrator)
![GitHub issues](https://img.shields.io/github/issues-raw/swaptoshi/swaptoshi-migrator)
![GitHub closed issues](https://img.shields.io/github/issues-closed-raw/swaptoshi/swaptoshi-migrator)

## Installation

### Dependencies

The following dependencies need to be installed in order to run applications created with the Klayr SDK:

| Dependencies   | Version                |
| -------------- | ---------------------- |
| NodeJS         | ^18.20.2               |
| NPM            | 9.8.1 or later         |
| Swaptoshi Core | 1.0.0-alpha.0 or later |

**NOTE**: It is important that NodeJS is installed using NVM. Please refer our documentation [here](https://docs.swaptoshi.com/node/install).

### System requirements

The following system requirements are recommended to run Swaptoshi Migrator:

#### Memory

- Machines with a minimum of 4 GB RAM.

#### Storage

- Machines with a minimum of 40 GB HDD.

## Setup

Follow Klayr Documentation guide for [setting up the migrator](https://klayr.xyz/documentation/klayr-core/management/migration.html#setting-up-the-klayr-migrator).

### Build Distributions (Linux, Darwin) from source

Clone the Swaptoshi Migrator repository using Git and initialize the modules.

```sh
$ git clone https://github.com/swaptoshi/swaptoshi-migrator
$ cd swaptoshi-migrator
$ git checkout $tag
$ nvm install $(cat .nvmrc)
$ npm install --global yarn
$ yarn; yarn build;
$ PLATFORM=$(uname | tr '[:upper:]' '[:lower:]')
$ ARCH=$(uname -m | sed 's/x86_64/x64/')
$ npx oclif-dev pack --targets=$PLATFORM-$ARCH
```

### Using the Migrator

After building the binaries, please extract the appropriate tarball and add it the the PATH environment variable as shown below to continue with the usage.

> Requires `jq`. If not already installed, please check https://jqlang.github.io/jq/download on how to install.

```sh
$ MIGRATOR_VERSION=$(jq -r .version < package.json)
$ PLATFORM=$(uname | tr '[:upper:]' '[:lower:]')
$ ARCH=$(uname -m | sed 's/x86_64/x64/')
$ mkdir ~/swaptoshi-migrator-extract
$ find ./dist -name swaptoshi-migrator-v$MIGRATOR_VERSION-$PLATFORM-$ARCH.tar.gz -exec cp {} ~/swaptoshi-migrator-extract \;
$ tar -C ~/swaptoshi-migrator-extract -xf ~/swaptoshi-migrator-extract/swaptoshi-migrator-v$MIGRATOR_VERSION-$PLATFORM-$ARCH.tar.gz
$ export PATH="$PATH:$HOME/swaptoshi-migrator-extract/swaptoshi-migrator/bin"
```

<!-- usage -->

```sh-session
$ npm install -g swaptoshi-migrator
$ swaptoshi-migrator COMMAND
running command...
$ swaptoshi-migrator (-v|--version|version)
swaptoshi-migrator/2.0.9 darwin-arm64 node-v18.20.1
$ swaptoshi-migrator --help [COMMAND]
USAGE
  $ swaptoshi-migrator COMMAND
...
```

<!-- usagestop -->

> **NOTE**: To verify the final results, please run the following command: `cat genesis_block.blob.SHA256` under the output directory and compare the results with other participants on [Discord](http://klayr.chat/).

<!-- commands -->

# Command Topics

- [`swaptoshi-migrator help`](docs/commands/help.md) - display help for swaptoshi-migrator

<!-- commandsstop -->

### Running Tests

Swaptoshi Migrator has an extensive set of unit tests. To run the tests, please install Swaptoshi Migrator from source, and then run the command:

```sh
$ npm test
```

## Migrating Swaptoshi Core

The [migration guide](./docs/migration.md) explains the transition process of Swaptoshi Core using this Swaptoshi Migrator.

## Get Involved

| Reason                          | How                                                                            |
| ------------------------------- | ------------------------------------------------------------------------------ |
| Want to chat with our community | [Reach them on Discord](http://klayr.chat)                                     |
| Found a bug                     | [Open a new issue](https://github.com/swaptoshi/swaptoshi-migrator/issues/new) |
| Want to develop with us         | [Create a fork](https://github.com/swaptoshi/swaptoshi-migrator/fork)          |

## License

Copyright 2024 Klayr Holding BV.

Copyright 2016-2024 Lisk Foundation

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
