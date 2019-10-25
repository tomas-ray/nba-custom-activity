'use strict';
var util = require('util');
const fs = require('fs');

// Deps
const Path = require('path');
const JWT = require(Path.join(__dirname, '..', 'lib', 'jwtDecoder.js'));
var util = require('util');
var http = require('https');
let axios = require("axios");
var request = require("request");
var jsforce = require('jsforce');
const jsonCircular = require('circular-json');
var campaignIdValue = '';
var connectionErrorMessage = [];

exports.logExecuteData = [];

function logData(req) {
    exports.logExecuteData.push({
        body: req.body,
        headers: req.headers,
        trailers: req.trailers,
        method: req.method,
        url: req.url,
        params: req.params,
        query: req.query,
        route: req.route,
        cookies: req.cookies,
        ip: req.ip,
        path: req.path,
        //host: req.host,
        fresh: req.fresh,
        stale: req.stale,
        protocol: req.protocol,
        secure: req.secure,
        originalUrl: req.originalUrl
    });
}

/*
 * POST Handler for /save/ route of Activity.
 */
exports.save = function (req, res) {
    console.log('Start => Save......');
    console.log('req body of save - > ' + jsonCircular.stringify(req.body));
    //writeToFile('Save', '46');
    res.status(200).send('Save');
};

/*
 * POST Handler for /publish/ route of Activity.
 */
exports.publish = function (req, res) {//console.log("publish function!!!");
    logData(req);
    console.log('Start => publish......');
    console.log('req of publish - > ' + jsonCircular.stringify(req.body));
    writeToFile('Req58 Publish===>' + jsonCircular.stringify(req), '58');
    res.status(200).send('Publish');
};

/*
 * POST Handler for /validate/ route of Activity.
 */
exports.validate = function (req, res) {//console.log("validate function!!!");
    logData(req);
    console.log('Start => validate......');
    console.log('ReqBody===>' + req.body);
    res.status(200).send('Validate');
    console.log("end validate function!!!");
};

/*
 * POST Handler for /Stop/ route of Activity.
 */
exports.stop = function (req, res) {//console.log("stop function!!!");
    console.log('Start => Stop......');
    console.log('req - > ' + jsonCircular.stringify(req));
    console.log('req of execute - > ' + jsonCircular.stringify(req.body));
    writeToFile('Req79 execute===>' + jsonCircular.stringify(req), '79');
    logData(req);
    res.status(200).send('Stop');
};

/*
 * POST Handler for /execute/ route of Activity.
 */
exports.execute = function (req, res) {
    console.log('Start => Execute....');
    writeToFile('Req88 Execute===>' + req, '88');
    console.log('ReqBody===>' + req.body);
    console.log('===========================');
    console.log(req.body.toString('utf8'));
    JWT(req.body, process.env.JWT_KEY, (err, decoded) => {

        if (err) {
            console.error(err);
            return res.status(401).end();
        }
        
        if (decoded && decoded.inArguments && decoded.inArguments.length > 0) {
            console.log('##### decoded ####=>', decoded);
            var decodedArgs = decoded.inArguments[0];

            getMcTokenJD(decodedArgs);

            return res.status(200).send('Execute');

        } else {
            console.error('inArguments invalid.');
            return res.status(400).end();
        }
    });
    console.log("end execute function!!!");
};

function writeToFile(output,lineNumber) {
    fs.appendFile("/home/appuser/logs/jsLogs.txt", output + "\r\n", function (err) {

        if (err) {
            return console.log(err);
        }

        console.log("The file was saved for " + lineNumber);
    });
}

function getMcTokenJD(decodedArgs) {
    console.log('activilty.js=>line:108');
    var bodyString = JSON.stringify({
        client_id: process.env.CLIENT_ID, // client id of installed app created in marketing cloud. stored as environment variable in host server
        client_secret: process.env.CLIENT_SECRET, //client secret of installed app created in marketing cloud. stored as environment variable in host server
        grant_type: "client_credentials" // fixed value
    });

    var header = {
        'Content-Type': 'application/json',
    };

    var mcRequest = {
        method: 'POST',
        headers: header,
        url: process.env.AUTHENTICATIONBASE_URI + 'v2/token'
    };

    request(mcRequest, function (error, response, body) {
        console.log('body ->' + body);
        console.log('activilty.js=>line:127');
        //writeToFile(body, "137");
        var jsonObject = JSON.parse(body);
        var token = jsonObject["access_token"];
        getDataXMLJD(decodedArgs, token);
    }).write(bodyString);
}
function getDataXMLJD(decodedArgs, token) {

    var xml = '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
        '<soapenv:Header>' + 
        '<fueloauth>' + token + '</fueloauth>' + 
        '</soapenv:Header>' + 
        '<soapenv:Body>' + 
            '<RetrieveRequestMsg xmlns="http://exacttarget.com/wsdl/partnerAPI">' +
            '<RetrieveRequest>' +
                // '<ObjectType>DataExtensionObject' +'[' + process.env.ACCOUNT_SALESFORCE_DE + ']' + '</ObjectType>' +
                '<ObjectType>DataExtensionObject[Account_STD]</ObjectType>' +
                '<Properties>NBA_Ongoing_Interaction__c</Properties>' +
                '<Filter xsi:type="SimpleFilterPart">' +
                    '<Property>Id</Property>' +
                    '<SimpleOperator>equals</SimpleOperator>' +
                    '<Value>' + decodedArgs.accountId + '</Value>' +
                '</Filter>' +
            '</RetrieveRequest>' +
        '</RetrieveRequestMsg>' +
        '</soapenv:Body>' + 
        '</soapenv:Envelope>'

    // example data
    const url = process.env.soap_Base_Uri + 'Service.asmx';
    console.log('URL - > ' + url);
    // const headers = {
    //     'Content-Type': 'text/xml',
    //     'soapAction': 'Retrieve'
    // };

    axios.post(url, xml, {
        headers: {
            'Content-Type': 'text/xml',
            'soapAction': 'Retrieve'
        }
    }
    ).then(response => {
        //console.log(response.data)
        const { body, statusCode } = response.data;
        console.log('RESPONSE - > ' + response.data);

        var parser = require('fast-xml-parser');
        var he = require('he');
        var options = {
            attributeNamePrefix: "@_",
            attrNodeName: "attr", //default is 'false'
            textNodeName: "#text",
            ignoreAttributes: true,
            ignoreNameSpace: false,
            allowBooleanAttributes: false,
            parseNodeValue: true,
            parseAttributeValue: false,
            trimValues: true,
            cdataTagName: "__cdata", //default is 'false'
            cdataPositionChar: "\\c",
            localeRange: "", //To support non english character in tag/attribute values.
            parseTrueNumberOnly: false,
            attrValueProcessor: a => he.decode(a, { isAttributeValue: true }),//default is a=>a
            tagValueProcessor: a => he.decode(a) //default is a=>a
        };

        if (parser.validate(response.data) === true) { //optional (it'll return an object in case it's not valid)
            //writeToFile(response.data, "204");
            var jsonObj = parser.parse(response.data, options);

            var soapEnvelope = jsonObj['soap:Envelope'];
            var soapBody = soapEnvelope['soap:Body'];
            var Property = soapBody.RetrieveResponseMsg.Results;
            if (Property == undefined) {
                var isOnGoing = '';
            }
            else {
                var isOnGoing = soapBody.RetrieveResponseMsg.Results.Properties.Property.Value;
            }
            requestGetProductInformationJD(isOnGoing, decodedArgs, token);

        }
        else {
            console.log('PARSER NOT VALIDATE');
        }
    }
    ).catch(err => { console.log(err) });
}
function requestGetProductInformationJD(isOnGoing, decodedArgs, token) {
    console.log('activity.js => line 216');
    var bodyStringRequest = JSON.stringify({
        decisionId: decodedArgs.decisionId,
        platform: process.env.PLATFORM,
        audienceList: [{
            customerId: decodedArgs.clientId,
            microSegment: decodedArgs.microSegment,
            isOngoing: isOnGoing
        }
        ],
        campaign: {
            campaignId: decodedArgs.campaignId,
            campaignName: decodedArgs.campaignName,
            campaignType: decodedArgs.campaignType,
            campaignProductType: [
                decodedArgs.campaignProductType
            ],
            overrideContactFramwork: decodedArgs.override
        }
    });

    console.log('bodyStringRequest - > ' + bodyStringRequest);

    var header = {
        'Content-Type': 'application/json',
        'Content-Length': bodyStringRequest.length
    };

    var mcRequest = {
        method: 'POST',
        headers: header,
        url: process.env.WS_URL

    };
    request(mcRequest, function (error, response, body) {
        if (error) {
            connectionErrorMessage[0] = error;
            console.log('connectionErrorMessage[2] - > ' + error);
        }
        else if (body) {
            console.log('activity.js => line 256');
           //writeToFile(body, "267");
            var jsonValue = JSON.parse(body);
            if (jsonValue.status == 'PS_FAILED') {
                console.log('connectionErrorMessage - > ' + error);
                connectionErrorMessage[0] = jsonValue.status + '-' + jsonValue.message;
            }
        }
        updateDataExtensionDE(body, token, decodedArgs);

    }).write(bodyStringRequest);
}
function updateDataExtensionDE(body, token, decodedArgs) {
    console.log('UPDATE DATA EXTENSION DE - >');
    let newProduct1 = '';
    let newProduct2 = '';
    let newProduct1Code = '';
    let newProduct2Code = '';
    let newProduct1Type = '';
    let newProduct2Type = '';
    let koReasonValue = '';
    let koStatusValue = '';
    let statusValue = '';
    let messageValue = '';
    let customerIdValue = '';
    var hasError;

    //koReasonFields
    let channelMismatchValue = '';
    let corporateClientsValue = '';
    let underTrustValue = '';
    let servicedByValue = '';
    let customerStatusValue = '';
    let agentStatusValue = ''; //here
    let controlGroupValue = '';
    let underBankruptcyValue = '';
    let foreignAddressValue = '';
    let foreignMobileNumberValue = '';
    let phladeceasedValue = '';
    let claimStatusValue = '';
    let claimTypeValue = '';
    let subClaimTypeValue = '';
    let failedTotalSumAssuredTestValue = '';
    let exclusionCodeImposedValue = '';
    let extraMoralityValue = '';
    let isSubstandardValue = '';
    let amlwatchListValue = '';
    let underwritingKOsValue = '';
    let existingProductsKOsValue = '';
    let salesPersonKOsValue = '';


    if (connectionErrorMessage.length > 0) {
        console.log('HERE ->');
        statusValue = process.env.ERROR;
        for (var i = 0; i < connectionErrorMessage.length; i++) {
            if (connectionErrorMessage[i] !== undefined) {
                messageValue = connectionErrorMessage[i];
            }
            console.log('MESSAGE VALUE - > ' + messageValue);
        }
    }
    else if (connectionErrorMessage.length === 0) {
        console.log('WS API BODY - > ' + body);
        console.log('activity.js => line 319');
        //writeToFile(body, "331");
        var jsonValue = JSON.parse(body);

        koStatusValue = jsonValue.koStatus;
        statusValue = jsonValue.status;
        messageValue = jsonValue.message;
        channelMismatchValue = jsonValue.koReason.channelMismatch
        corporateClientsValue = jsonValue.koReason.corporateClients
        underTrustValue = jsonValue.koReason.underTrust
        servicedByValue = jsonValue.koReason.servicedBy
        customerStatusValue = jsonValue.koReason.customerStatus
        agentStatusValue = jsonValue.koReason.agentStatus
        controlGroupValue = jsonValue.koReason.controlGroup
        underBankruptcyValue = jsonValue.koReason.underBankruptcy
        foreignAddressValue = jsonValue.koReason.foreignAddress
        foreignMobileNumberValue = jsonValue.koReason.foreignMobileNumber
        phladeceasedValue = jsonValue.koReason.phladeceased
        claimStatusValue = jsonValue.koReason.claimStatus
        claimTypeValue = jsonValue.koReason.claimType
        subClaimTypeValue = jsonValue.koReason.subClaimType
        failedTotalSumAssuredTestValue = jsonValue.koReason.failedTotalSumAssuredTest
        exclusionCodeImposedValue = jsonValue.koReason.exclusionCodeImposed
        extraMoralityValue = jsonValue.koReason.extraMorality
        isSubstandardValue = jsonValue.koReason.isSubstandard
        amlwatchListValue = jsonValue.koReason.amlwatchList
        underwritingKOsValue = jsonValue.koReason.underwritingKOs
        existingProductsKOsValue = jsonValue.koReason.existingProductsKOs
        salesPersonKOsValue = jsonValue.koReason.salesPersonKOs

        console.log('ConnectionErrorMessage length - >' + connectionErrorMessage.length);
        console.log('koStatus - > ' + koStatusValue);
        console.log('jsonKoStatus - > ' + jsonValue.koStatus);
        console.log('jsonValue.offerProducts - > ' + jsonValue.offerProducts.length);

        if (jsonValue.offerProducts.length === 0 && jsonValue.koStatus == process.env.KO_STATUS_NO) {
            console.log('1ST -> ');
            koStatusValue = process.env.KO_STATUS_YES;
        }
        else if (jsonValue.koStatus == process.env.KO_STATUS_YES && jsonValue.offerProducts.length !== 0) {
            console.log('2ND -> ');
            koStatusValue = process.env.KO_STATUS_NO;
        }

        if (koStatusValue == process.env.KO_STATUS_NO && jsonValue.offerProducts.length !== 0) {
            console.log('3RD - > ');
            var offerProductsSorted = jsonValue.offerProducts.slice(0);
            offerProductsSorted.sort(function (a, b) {
                return a.productRank - b.productRank;
            });
            for (var i = 0; i < offerProductsSorted.length; i++) {
                if (i === 0) {
                    newProduct1 = offerProductsSorted[i].productName;
                    newProduct1Code = offerProductsSorted[i].productCode;
                    newProduct1Type = offerProductsSorted[i].componentCode;
                }
                else if (i = 1) {
                    newProduct2 = offerProductsSorted[i].productName;
                    newProduct2Code = offerProductsSorted[i].productCode;
                    newProduct2Type = offerProductsSorted[i].componentCode;
                }
            }
        }
    }

    console.log('koStatusValue - > ' + koStatusValue);

    var bodyStringInsertRowDE = JSON.stringify([
        {
            keys: {
                PK: decodedArgs.decisionId + '-' + decodedArgs.journeyStepCode,
                CampaignAudienceId: decodedArgs.decisionId
            },
            values: {
                customerId: decodedArgs.clientId,
                PersonContactId: decodedArgs.contactId,
                CampaignId: decodedArgs.campaignId,
                journeyStepCode: decodedArgs.journeyStepCode,
                Product1Name: newProduct1,
                Product2Name: newProduct2,
                Product1Code: newProduct1Code,
                Product1ComponentCode: newProduct1Type,
                Product2Code: newProduct2Code,
                Product2ComponentCode: newProduct2Type,
                koStatus: koStatusValue,
                Status: statusValue,
                Message: messageValue,
                PersonContactId: decodedArgs.contactId,
                channelMismatch: channelMismatchValue,
                corporateClients: corporateClientsValue,
                underTrust: underTrustValue,
                servicedBy: servicedByValue,
                customerStatus: customerStatusValue,
                agentStatus: agentStatusValue,
                controlGroup: controlGroupValue,
                underBankruptcy: underBankruptcyValue,
                foreignAddress: foreignAddressValue,
                foreignMobileNumber: foreignMobileNumberValue,
                phladeceased: phladeceasedValue,
                claimStatus: claimStatusValue,
                claimType: claimTypeValue,
                subClaimType: subClaimTypeValue,
                failedTotalSumAssuredTest: failedTotalSumAssuredTestValue,
                exclusionCodeImposed: exclusionCodeImposedValue,
                extraMorality: extraMoralityValue,
                isSubstandard: isSubstandardValue,
                amlwatchList: amlwatchListValue,
                underwritingKOs: underwritingKOsValue,
                existingProductsKOs: existingProductsKOsValue,
                salesPersonKOs: salesPersonKOsValue
            }
        }
    ]);

    console.log('bodyStringInsertRowDE -> ' + bodyStringInsertRowDE);

    var headerInsertDE = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
    };
    var optionRequestInsertDE = {
        method: 'POST',
        headers: headerInsertDE,
        url: process.env.rest_Base_Uri + 'hub/v1/dataevents/key:' + process.env.DATA_EXTENSTION_KEY + '/rowset'
    };

    request(optionRequestInsertDE, function (error, response, body) {
        console.log('BODY - > ' + body);
    }).write(bodyStringInsertRowDE);
}

writeToFile('hello world', '466');

