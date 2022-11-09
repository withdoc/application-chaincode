/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');
const stringify  = require('json-stringify-deterministic');
const sortKeysRecursive  = require('sort-keys-recursive');


class DocumentTransfer extends Contract {
    async InitLedger(ctx) {
        const users = [{
            id: "admin@admin.com", // email is hashed
            userId : "admin",
            email: "admin@admin.com",
            password: "adminpw",
            name: "",
            birthday : "2022-02-01",
            address: "성북구",
            sex: "1",
            nation : "대한민국"
        }];

        for (const user of users) {
            user.docType = 'user';
            await ctx.stub.putState(user.id, Buffer.from(stringify(sortKeysRecursive(user))));
        }
    }

    async CreateUser(ctx, id, email, password, name, birthday, address, sex, nation){
        const user = {
            Id: email, // email is hashed
            UserId : id,
            Email: email,
            Password: password,
            Name: name,
            Birthday : birthday,
            Address: address,
            Sex: sex,
            Nation : nation
        };
        ctx.stub.putState(email, Buffer.from(JSON.stringify(user)));
        return JSON.stringify(user);
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
    async DeleteUser(ctx, email, password) {
        const exists = await this.UserExists(ctx, email, password)
        if (exists)
            return ctx.stub.deleteState(email);
        else
            throw new Error(`The document ${email} does not exist`);
        
    }
    async ModifyPassword(ctx, email, newPassword){ // update로 변경 해야함
        const exists = await this.AssetExists(ctx, email);
        if(exists){
            const updatedUser = {
                "password": newPassword,
            };
            ctx.stub.putState(id, Buffer.from(JSON.stringify(updatedUser)));
            return JSON.stringify(updatedUser);
        }
        else{
            throw new Error(`The document ${email} does not exist`);
        }
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

    // AssetExists returns true when asset with given ID exists in world state.
    async DocumentExists(ctx, id) {
        const documentJSON = await ctx.stub.getState(id);
        return documentJSON && documentJSON.length > 0;
    }

    async UserExists(ctx, email, password) {
		// ==== Check if asset already exists ====
		let emailState = await ctx.stub.getState(email);
        console.log(emailState);
		return emailState && emailState.length > 0;
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
