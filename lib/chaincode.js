/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');

class DocumentTransfer extends Contract {

    // CreateAsset issues a new asset to the world state with given details.
    async CreateAsset(ctx, id, color, size, owner, appraisedValue) {
        const asset = {
            ID: id,
            Color: color,
            Size: size,
            Owner: owner,
            AppraisedValue: appraisedValue,
        };
        ctx.stub.putState(id, Buffer.from(JSON.stringify(asset)));
        return JSON.stringify(asset);
    }
    async CreateDocument(
        ctx, id, userId, docName, 
        docSerialNum, docPublishedDate, docExpiryDate,
        docPublishOrg, docType) {
        const document = {
            ID: id,
            UserId : userId,
            DocName : docName,
            DocSerialNum : docSerialNum,
            DocPublishedDate : docPublishedDate,
            DocExpiryDate : docExpiryDate,
            DocPublishOrg : docPublishOrg,
            DocType : docType
        };
        ctx.stub.putState(id, Buffer.from(JSON.stringify(document)));
        return JSON.stringify(document);
    }

    // ReadAsset returns the asset stored in the world state with given id.
    async ReadDocument(ctx, id) {
        const documentJSON = await ctx.stub.getState(id); // get the asset from chaincode state
        if (!documentJSON || documentJSON.length === 0) {
            throw new Error(`The document ${id} does not exist`);
        }
        return documentJSON.toString();
    }

    // UpdateAsset updates an existing asset in the world state with provided parameters.
    async UpdateDocument(ctx, id, color, size, owner, appraisedValue) {
        const exists = await this.DocumentExists(ctx, id);
        if (!exists) {
            throw new Error(`The document ${id} does not exist`);
        }

        // overwriting original asset with new asset
        const updatedDocument = {
            ID: id,
            Color: color,
            Size: size,
            Owner: owner,
            AppraisedValue: appraisedValue,
        };
        return ctx.stub.putState(id, Buffer.from(JSON.stringify(updatedDocument)));
    }

    // DeleteAsset deletes an given asset from the world state.
    async DeleteAsset(ctx, id) {
        const exists = await this.DocumentExists(ctx, id);
        if (!exists) {
            throw new Error(`The document ${id} does not exist`);
        }
        return ctx.stub.deleteState(id);
    }

    // AssetExists returns true when asset with given ID exists in world state.
    async DocumentExists(ctx, id) {
        const documentJSON = await ctx.stub.getState(id);
        return documentJSON && documentJSON.length > 0;
    }

    // GetAllAssets returns all assets found in the world state.
    async GetAllAssets(ctx) {
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push({ Key: result.value.key, Record: record });
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }


}

module.exports = DocumentTransfer;
