/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const documentTransfer = require('./lib/chaincode');

module.exports.DocumentTransfer = documentTransfer;
module.exports.contracts = [documentTransfer];
