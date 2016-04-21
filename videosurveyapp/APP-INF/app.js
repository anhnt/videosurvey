// admin controllers

controllerMappings
    .dependencies()
    .add('KongoDB')
    .build();

controllerMappings
    .adminController()
    .path('/videosurvey/')
    .enabled(true)
    .defaultView(views.templateView('videosurveyapp/manageSurveys.html'))
    .addMethod('GET', 'getSurveys')
    .addMethod('POST', 'saveSurvey', 'saveSurvey')
    .addMethod('POST', 'deleteSurvey', 'deleteSurvey')
    .addMethod('POST', 'clearSurveyResult', 'clearSurveyResult')
    .build();

controllerMappings
    .adminController()
    .path('/videosurvey')
    .enabled(true)
    .addMethod("GET", "checkRedirect")
    .build();

controllerMappings
    .adminController()
    .path('/videosurvey/(?<surveyId>[^/]*)/')
    .enabled(true)
    .addPathResolver('surveyId', 'findSurvey')
    .defaultView(views.templateView('videosurveyapp/surveyDetail.html'))
    .addMethod('GET', 'getSurvey')
    .addMethod('POST', 'saveSurvey')
    .title('generateTitle')
    .build();

controllerMappings
    .adminController()
    .path('/videosurvey/(?<surveyId>[^/]*)')
    .enabled(true)
    .addMethod("GET", "checkRedirect")
    .build();

controllerMappings
    .adminController()
    .path('/videosurvey/saveGroupAccess/')
    .enabled(true)
    .addMethod('POST', 'saveGroupAccess')
    .build();

controllerMappings
    .adminController()
    .path('/videosurvey/answer/')
    .enabled(true)
    .addMethod('GET','deleteAnswer', 'deleteAnswer')
    .addMethod('GET','getPlainAnswers', 'getPlainAnswers')
    .addMethod('POST','saveAnswer')
    .build();

controllerMappings
    .adminController()
    .path('/videosurvey/clearResult/')
    .enabled(true)
    .addMethod('POST','clearResult')
    .build();

controllerMappings
    .adminController()
    .path('/videosurvey/question/')
    .enabled(true)
    .addMethod('GET','getQuestion','getQuestion')
    .addMethod('GET','deleteQuestion','deleteQuestion')
    .addMethod('POST','saveQuestion')
    .build();

controllerMappings
    .adminController()
    .path('/videosurvey/viewFile/')
    .enabled(true)
    .addMethod('GET','viewFile')
    .build();

// website controllers
controllerMappings
    .websiteController()
    .path('/videosurvey/')
    .enabled(true)
    .defaultView(views.templateView('videosurveyapp/manageSurveys.html'))
    .addMethod('GET', 'getSurveys')
    .build();

controllerMappings
    .websiteController()
    .path('/videosurvey')
    .enabled(true)
    .addMethod("GET", "checkRedirect")
    .build();

controllerMappings
    .websiteController()
    .path('/videosurvey/(?<surveyId>[^/]*)/')
    .enabled(true)
    .postPriviledge("READ_CONTENT")
    .addPathResolver('surveyId', 'findSurvey')
    .defaultView(views.templateView('videosurveyapp/surveyDetail.html'))
    .addMethod('GET', 'getSurvey')
    .addMethod('POST', 'submitSurvey')
    .title('generateWebsiteTitle')
    .build();

controllerMappings
    .websiteController()
    .path('/videosurvey/(?<surveyId>[^/]*)')
    .enabled(true)
    .addMethod("GET", "checkRedirect")
    .build();

controllerMappings
    .websiteController()
    .path('/videosurvey/(?<surveyId>[^/]*)/result/')
    .enabled(true)
    .addPathResolver('surveyId', 'findSurvey')
    .defaultView(views.templateView('videosurveyapp/surveyResult.html'))
    .addMethod('GET', 'getSurvey')
    .title('generateWebsiteTitle')
    .build();

controllerMappings
    .websiteController()
    .path('/videosurvey/(?<surveyId>[^/]*)/result')
    .enabled(true)
    .addMethod("GET", "checkRedirect")
    .build();

controllerMappings
    .websiteController()
    .path('/videosurvey/submitSurvey/')
    .enabled(true)
    .postPriviledge("READ_CONTENT")
    .addMethod("POST", "submitSurveyOnly")
    .build();

controllerMappings
    .websiteController()
    .path('/videosurvey/submitAnswer/')
    .enabled(true)
    .postPriviledge("READ_CONTENT")
    .addMethod("POST", "submitAnswer")
    .build();

function initApp(orgRoot, webRoot, enabled){
    log.info("initApp: orgRoot={}", orgRoot);

    var dbs = orgRoot.find('jsondb');
    var db = dbs.child(DB_NAME);
    
    if (isNull(db)) {
        log.info('{} does not exist!', DB_TITLE);

        db = dbs.createDb(DB_NAME, DB_TITLE, DB_NAME);

        saveMapping(db);
    }
}

function checkRedirect(page, params) {
    var href = page.href;
    if (!href.endsWith('/')) {
        href = href + '/';
    }

    return views.redirectView(href);
}