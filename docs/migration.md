# Migration Guide

This section explains how to migrate a Swaptoshi Core using the Swaptoshi Migrator.

The Swaptoshi Migrator CLI tool will generate a new genesis (snapshot) block for Swaptoshi Core.
The new genesis block is created based on a snapshot of the existing blockchain (running on Swaptoshi Core) at a pre-determined height.

Swaptoshi Migrator automatically exports the node's Forging Status information to the file named `forgingStatus.json` under the output directory.
In case, the Swaptoshi Migrator is unable to save to the disk, as a fallback, the Forging Status information is logged to the standard output.

<!--

> Note: Please ensure that the file name and the checksum filename are the same, whereby the checksum file has an additional extension (klayr-migrator-v2.0.2.tar.gz, and will have a checksum file by the name of klayr-migrator-v2.0.2.tar.gz.SHA256), and are present in the same directory.

-->

<!-- Please ensure you are running version v4.0.1 (or later) of Lisk Core to be able to seamlessly migrate to Klayr Core 4.x. -->

## Setting up the Swaptoshi Migrator

The migrator setup can be performed by following the steps defined in the `SETUP` section [here](../README.md#setup).

## Migration Steps

**Check the announced snapshot height**

- For Mainnet: `TBD`
- For Testnet: `TBD`

### Run Swaptoshi Migrator

The Swaptoshi Migrator also allows users to download and start the Swaptoshi Core automatically, post migration. This can be achieved by passing the relevant flags shown below.

```
Migrate Swaptoshi Core

USAGE
  $ swaptoshi-migrator

OPTIONS
  -c, --config=config                     Custom configuration file path for Swaptoshi Core

  -d, --data-path=data-path               Path where the Swaptoshi Core instance is running. When not supplied, defaults to the default data directory for Swaptoshi Core.

  -h, --help                              show CLI help

  -n, --network=(mainnet|testnet|devnet)  Network to be considered for the migration. Depends on the '--snapshot-path' flag.

  -o, --output=output                     File path to write the genesis block. If not provided, it will default to cwd/output/{networkIdentifier}/genesis_block.blob. Do not use any value starting with the default data path reserved for Swaptoshi Core: '/Users/aldhosutra/.klayr/swaptoshi-core'.

  -p, --page-size=page-size               [default: 100000] Maximum number of blocks to be iterated at once for computation. Defaults to 100000.

  -s, --snapshot-height=snapshot-height   (required) The height at which re-genesis block will be generated. Can be specified with SNAPSHOT_HEIGHT as well.

  -v, --version                           show CLI version

  --auto-migrate-config                   Migrate user configuration automatically. Defaults to false.

  --auto-start-swaptoshi-core             Start Swaptoshi Core automatically. Defaults to false. When using this flag, kindly open another terminal window to stop Swaptoshi Core for when the migrator prompts.

  --snapshot-path=snapshot-path           Local filepath to the state snapshot to run the migration offline. It could either point to a directory or a tarball (tar.gz).

  --snapshot-url=snapshot-url             URL to download the state snapshot from. Use to run the migration offline. URL must end with tar.gz.
```

<!--

If you have added `klayr-migrator` to the PATH as described in the [setting-up-the-klayr-migrator](#setting-up-the-klayr-migrator) section, you can start the migration script by running the following command in the terminal:

-->

You can start the migration script by running the following command in the terminal:

**Mainnet**

```
swaptoshi-migrator --snapshot-height [recommendedSnapshotHeight] --output ~/.klayr/swaptoshi-core/config/mainnet --data-path ~/.klayr/swaptoshi-core --auto-migrate-config --auto-start-swaptoshi-core
```

**Testnet**

```
swaptoshi-migrator --snapshot-height [recommendedSnapshotHeight] --output ~/.klayr/swaptoshi-core/config/testnet --data-path ~/.klayr/swaptoshi-core --auto-migrate-config --auto-start-swaptoshi-core
```

- `--snapshot-height`:
  The height at which the blockchain snapshot will be performed.
  The snapshot height will be announced separately.
- `--output`:
  The absolute path to the directory, where the newly generated genesis block should be saved.
- `--data-path`:
  The absolute path to the directory, where the Swaptoshi Core node is located.
- `--auto-migrate-config`:
  Migrate Swaptoshi Core configuration automatically.
- `--auto-start-swaptoshi-core`:
  Start Swaptoshi Core automatically.

Alternatively, the genesis block and configuration for Swaptoshi Core migration can be created separately without starting Swaptoshi Core automatically as shown below:

**Mainnet**

```
swaptoshi-migrator --snapshot-height [recommendedSnapshotHeight] --output ~/.klayr/swaptoshi-core/config/mainnet --data-path ~/swaptoshi-main --auto-migrate-config
```

**Testnet**

```
swaptoshi-migrator --snapshot-height [recommendedSnapshotHeight] --output ~/.klayr/swaptoshi-core/config/testnet --data-path ~/swaptoshi-test --auto-migrate-config
```

In case `--auto-start-swaptoshi-core` is disabled, please install & start Swaptoshi Core manually.
Please follow the steps in the [README guide](https://github.com/swaptoshi/swaptoshi-core/blob/development/README.md#installation) to perform the installation.

```
swaptoshi-core start --network ${network} --api-ipc --api-ws --config=~/.klayr/swaptoshi-core/config/config.json
```
