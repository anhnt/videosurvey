var PLAIN_TEXT_ANSWER = 'PLAIN_TEXT_ANSWER';
var VIDEO_ANSWER = 'VIDEO_ANSWER';
function generateWebsiteTitle(page) {
    log.info('generateWebsiteTitle > page={}', page);
    var title = page.attributes.surveyId.jsonObject.name;
    return title;
}

// POST /ksurvey/surveyId
function submitSurvey(page, params) {
    log.info('submitSurvey >', params.submitSurvey);


    log.info('params {}', params);
    var surveyId = params['temp-surveyId'];
    var userId = params['temp-user'];
    var userAgentHeader = params['temp-userAgentHeader'];
    var fromAddress = params['temp-fromAddress'];
    var totalQuestions = params['temp-totalQuestions'];
    var surveyResult = [];
    var parser = new UAParser(userAgentHeader).getResult();
    var browserName = parser.browser.name;
    var browserVersion = parser.browser.version;
    var osName = parser.os.name;
    var osVersion = parser.os.version;
    var deviceVendor = 'N/A';
    var deviceModel = 'N/A';
    var deviceType = 'N/A';
    if (parser.device.model && parser.device.vendor) {
        deviceVendor = parser.device.vendor;
        deviceModel = parser.device.model;
        deviceType = parser.device.type;
    }
    for (var p in params) {
        if (p.indexOf('question-') === 0) {
            if (surveyId && p && params[p]) {
                var answerBody = '';
                var answerId = '';
                if (params[p].indexOf('answer-') === -1) {
                    answerBody = params[p];
                    answerId = PLAIN_TEXT_ANSWER;
                    surveyResult.push({
                        answerBody: answerBody,
                        answerId: answerId,
                        questionId: p,
                    });
                } else {
                    answerId = params[p];
                    if (answerId.indexOf(',') !== -1) {
                        var answerIds = answerId.split(',');
                        for (var i = 0; i < answerIds.length; i++) {
                            if (answerIds[i] && answerIds[i].indexOf('answer-') === 0) {
                                surveyResult.push({
                                    questionId: p,
                                    answerId: answerIds[i],
                                    answerBody: answerBody
                                });
                            }
                        }
                    } else {
                        surveyResult.push({
                            questionId: p,
                            answerId: answerId,
                            answerBody: answerBody,
                        });
                    }
                }
            }
        }
    }

    var db = getDB(page);
    var result = {
        status: true,
        messages: ['Successfully submitted survey'],
        data: surveyResult
    };
    if (surveyResult.length < totalQuestions) {
        result.status = false;
        result.messages = ['Please check your answers and submit again!'];
    } else {
        for (var i = 0; i < surveyResult.length; i++) {
            newId = RECORD_TYPES.RESULT + '-' + generateRandomText(30);
            var obj = {
                surveyId: surveyId,
                userId: userId,
                answerBody: answerBody,
                createdDate: new Date()
            };
            obj.questionId = surveyResult[i].questionId;
            obj.answerId = surveyResult[i].answerId;
            obj.answerBody = surveyResult[i].answerBody;
            db.createNew(newId, JSON.stringify(obj), RECORD_TYPES.RESULT);
        }

        newSurveySubmitId = RECORD_TYPES.SUBMIT + '-' + generateRandomText(30);
        var submitObj = {
            fromAddress: fromAddress,
            browserName: browserName,
            browserVersion: browserVersion,
            osName: osName,
            osVersion: osVersion,
            deviceVendor: deviceVendor,
            deviceType: deviceType,
            deviceModel: deviceModel,
            surveyId: surveyId,
            userId: userId,
            createdDate: new Date()
        };
        db.createNew(newSurveySubmitId, JSON.stringify(submitObj), RECORD_TYPES.SUBMIT);
        log.info('saveResult done {}', JSON.stringify(surveyResult));
    }

    return views.jsonObjectView(JSON.stringify(result)).wrapJsonResult();
}

// private function to check if user already submitted survey
function getSurveyResultByUser(page, userId, surveyId) {
    var queryJson = {
        'fields': [
            'surveyId',
            'userId'
        ],
        'size': 1,
        'query': {
            'bool': {
                'must': [
                    {'type': {'value': RECORD_TYPES.SUBMIT}},
                    {'term': {'surveyId': surveyId}},
                    {'term': {'userId': userId}}
                ]
            }
        }
    };
    var result = doDBSearch(page, queryJson);
    log.info('getSurveyResultByUser {}', result);
    return result;
}

function viewSurveyResult(page, params) {
    log.info('viewSurveyResult {}', params);
}

function getQuestionResult(page, userId, surveyId, questionId) {
    var queryJson = {
        'fields': [
            'questionId',
            'userId'
        ],
        'size': 1,
        'query': {
            'bool': {
                'must': [
                    {'type': {'value': RECORD_TYPES.RESULT}},
                    {'term': {'surveyId': surveyId}},
                    {'term': {'userId': userId}},
                    {'term': {'questionId': questionId}}
                ]
            }
        }
    };
    var result = doDBSearch(page, queryJson);
    return result.hits.totalHits > 0;
}

function submitAnswer(page, params, files) {
    log.info("submitAnswer > page {} params {} files {}", page, params, files);
    var db = getDB(page);
    var surveyId = params.surveyId;
    var questionId = params.questionId;
    var userId = params.userId;
    var anwserId = VIDEO_ANSWER;
    var fileJson;
    if (files !== null || !files.isEmpty()) {
        var fileArray = files.entrySet().toArray();
        var file = fileArray[0].getValue();
        log.info('file upload {}', file);
        var hash = fileManager.uploadFile(file);

        fileJson = {
            fileName: questionId,
            type: file.contentType,
            size: file.size,
            uploaded_date: new Date(),
            hash: hash
        };
        log.info("File json {}", JSON.stringify(fileJson));
    }

    var answerBody = JSON.stringify(fileJson);
    var obj;
    var result;
    if (surveyId && questionId && userId && answerBody) {
        var newId = RECORD_TYPES.RESULT + '-' + generateRandomText(30);
        obj = {
            surveyId: surveyId,
            userId: userId,
            questionId: questionId,
            answerId: anwserId,
            answerBody: answerBody,
            createdDate: new Date()
        };
        db.createNew(newId, JSON.stringify(obj), RECORD_TYPES.RESULT);
        result = {
            status: true,
            data: obj
        };
    } else {
        result = {
            status: false,
            message: 'Could not store answer'
        };
    }

    return views.jsonObjectView(JSON.stringify(result));
}

function submitSurveyOnly(page, params) {
    log.info('params {}', params);
    var surveyId = params['temp-surveyId'];
    var userId = params['temp-user'];
    var userAgentHeader = params['temp-userAgentHeader'];
    var fromAddress = params['temp-fromAddress'];
    var totalQuestions = params['temp-totalQuestions'];
    var parser = new UAParser(userAgentHeader).getResult();
    var browserName = parser.browser.name;
    var browserVersion = parser.browser.version;
    var osName = parser.os.name;
    var osVersion = parser.os.version;
    var deviceVendor = 'N/A';
    var deviceModel = 'N/A';
    var deviceType = 'N/A';
    if (parser.device.model && parser.device.vendor) {
        deviceVendor = parser.device.vendor;
        deviceModel = parser.device.model;
        deviceType = parser.device.type;
    }
    // Validate result
    var totalResult = getTotalSurveyResult(page, surveyId, userId);
    var returnObj = {
        status: false
    };
    if(totalResult && totalResult.hits.totalHits >= totalQuestions){
        newSurveySubmitId = RECORD_TYPES.SUBMIT + '-' + generateRandomText(30);
        var submitObj = {
            fromAddress: fromAddress,
            browserName: browserName,
            browserVersion: browserVersion,
            osName: osName,
            osVersion: osVersion,
            deviceVendor: deviceVendor,
            deviceType: deviceType,
            deviceModel: deviceModel,
            surveyId: surveyId,
            userId: userId,
            createdDate: new Date()
        };
        var db = getDB(page);
        db.createNew(newSurveySubmitId, JSON.stringify(submitObj), RECORD_TYPES.SUBMIT);
        log.info('saveResult done {}', JSON.stringify(submitObj));
        returnObj.status = true;
    }

    return views.jsonObjectView(JSON.stringify(returnObj));
}

function getTotalSurveyResult(page, surveyId, userId){
    var queryJson = {
        'fields': [
            'questionId',
            'userId'
        ],
        'size': 10000,
        'query': {
            'bool': {
                'must': [
                    {'type': {'value': RECORD_TYPES.RESULT}},
                    {'term': {'surveyId': surveyId}},
                    {'term': {'userId': userId}}
                ]
            }
        }
    };
    var result = doDBSearch(page, queryJson);
    return result;
}