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
            Nation : nation,
            dataType : "user"
        };
        ctx.stub.putState(email, Buffer.from(JSON.stringify(user)));
        return JSON.stringify(user);
    }
    async CreateDocument(ctx, documentId, detailId, email, password, docName, docSerialNum,
        docPublishedDate, docExpiryDate, docPublishOrg, docType, dataType) {
        const document = {
            "id": documentId,
            "userId": email,
            "docName": docName,
            "docSerialNum": docSerialNum,
            "docPublishedDate": docPublishedDate,
            "docExpiryDate": docExpiryDate,
            "docPublishedOrg": docPublishOrg,
            "docType": docType,
            "dataType": dataType,
        }
        var docDetail = {
            "id": detailId,
            "docId": document.id,
            "dataType":"docDetail"
        };
        const exists = await this.UserExists(ctx, email, password);
        if(exists){
            
            switch (docType) {
                case "VISA":
                    docDetail.visaType = docType;
                    break
                case "PASSPORT":
                    docDetail.passportSerialNumber = docType;
                    break
                case "DRIVERLICENSE":
                    docDetail.driverLicenseSerialNumber = docType;
                    break
                default:
                    break
            }
            
            await ctx.stub.putState(document.id, Buffer.from(JSON.stringify(document)));
            await ctx.stub.putState(docDetail.id, Buffer.from(JSON.stringify(docDetail)));
            return JSON.stringify(document);
        }
        else
            return new Error(`The user ${email} does not exist`);
       
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
        const exists = await this.UserExists(ctx, email, password);
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
		return emailState && emailState.length > 0;
	}

    // GetAllAssets returns all assets found in the world state.

}

module.exports = DocumentTransfer;
