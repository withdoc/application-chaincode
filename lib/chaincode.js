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
    async DeleteUser(ctx, email, password) {
        const exists = await this.UserExists(ctx, email, password);
        if (exists)
            return ctx.stub.deleteState(email);
        else
            throw new Error(`The document ${email} does not exist`);
    }
    async ModifyPassword(ctx, email, password, newPassword){ // update로 변경 해야함
        const exists =  await this.UserExists(ctx, email, password);
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

    async UserExists(ctx, email, password) {
		// ==== Check if asset already exists ====
		let emailState = await ctx.stub.getState(email);
		return emailState && emailState.length > 0;
	}

    async CreateDocument(ctx, documentId, detailId, email, password, docName, docSerialNum,
        docPublishedDate, docExpiryDate, docPublishOrg, docType, dataType, docDetailSerialNum) {
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
                    docDetail.visaType = docDetailSerialNum;
                    break
                case "PASSPORT":
                    docDetail.passportSerialNumber = docDetailSerialNum;
                    break
                case "DRIVERLICENSE":
                    docDetail.driverLicenseSerialNumber = docDetailSerialNum;
                    break;
                default:
                    return new Error(`The kind of document is not support`);
                    break;
            }
            
            await ctx.stub.putState(document.id, Buffer.from(JSON.stringify(document)));
            await ctx.stub.putState(docDetail.id, Buffer.from(JSON.stringify(docDetail)));
            return JSON.stringify(document);
        }
        else
            return new Error(`The user ${email} does not exist`);
    }

    async GetAllDocuments(ctx, email) {

        let queryString = {};
		queryString.selector = {};
		queryString.selector.userId = email;
        queryString.selector.dataType = "document" ;
        return await this.GetQueryResultForQueryString(ctx, JSON.stringify(queryString)); 
        
    }
    // 특정 문서의 디테일 정보를 쿼리합니다.
    async GetSpecificDocDetail(ctx, docId){
        let queryString = {};
		queryString.selector = {};
		queryString.selector.docId = docId;
        let emailState = await ctx.stub.getState(email);
        return await this.GetQueryResultForQueryString(ctx, JSON.stringify(queryString)); 
    }
    // 특정 문서의 기본 정보를 쿼리합니다.
    async GetSpecificDocument(ctx, docId){
        const documentJSON = await ctx.stub.getState(docId);
        if(!documentJSON || documentJSON.length === 0)
            throw new Error(`the document ${docId} does not exist`);
        return documentJSON;
    }
    async GetDocumentDetail(ctx, docId){
        let queryString = {};
        queryString.selector = {};
        queryString.selector.docId = docId;
        queryString.selector.dataType = "docDetail";
        return await this.GetQueryResultForQueryString(ctx, JSON.stringify(queryString)); 
    }
    async DeleteDocument(ctx, email, password, docId) {
        const exists = await this.UserExists(ctx, email, password);
        if (exists)
            return ctx.stub.deleteState(docId);
        else
            throw new Error(`The document ${email} does not exist`);
    }
    async GetQueryResultForQueryString(ctx, queryString) {

		let resultsIterator = await ctx.stub.getQueryResult(queryString);
		let results = await this._GetAllResults(resultsIterator, false);

		return JSON.stringify(results);
	}


    // AssetExists returns true when asset with given ID exists in world state.
    async DocumentExists(ctx, id) {
        const documentJSON = await ctx.stub.getState(id);
        return documentJSON && documentJSON.length > 0;
    }

    async GetQueryResultForQueryString(ctx, queryString) {

		let resultsIterator = await ctx.stub.getQueryResult(queryString);
		let results = await this._GetAllResults(resultsIterator, false);

		return JSON.stringify(results);
	}

    async _GetAllResults(iterator, isHistory) {
		let allResults = [];
		let res = await iterator.next();
		while (!res.done) {
			if (res.value && res.value.value.toString()) {
				let jsonRes = {};
				console.log(res.value.value.toString('utf8'));
				if (isHistory && isHistory === true) {
					jsonRes.TxId = res.value.txId;
					jsonRes.Timestamp = res.value.timestamp;
					try {
						jsonRes.Value = JSON.parse(res.value.value.toString('utf8'));
					} catch (err) {
						console.log(err);
						jsonRes.Value = res.value.value.toString('utf8');
					}
				} else {
					jsonRes.Key = res.value.key;
					try {
						jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
					} catch (err) {
						console.log(err);
						jsonRes.Record = res.value.value.toString('utf8');
					}
				}
				allResults.push(jsonRes);
			}
			res = await iterator.next();
		}
		iterator.close();
		return allResults;
	}

}

module.exports = DocumentTransfer;
