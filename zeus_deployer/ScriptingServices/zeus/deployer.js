/* globals $ */
/* eslint-env node, dirigible */

var request = require('net/http/request');
var response = require('net/http/response');
var applications = require('zeus/utils/applications');

handleRequest(request, response);

function handleRequest(httpRequest, httpResponse) {
	try {
		dispatchRequest(httpRequest, httpResponse);
	} catch (e) {
		console.error(e);
		sendResponse(httpResponse, httpResponse.BAD_REQUEST, 'text/plain', e);
	}
}

function dispatchRequest(httpRequest, httpResponse) {
	response.setContentType('application/json; charset=UTF-8');
	response.setCharacterEncoding('UTF-8');

	switch (httpRequest.getMethod()) {
		case 'POST': 
			handlePostRequest(httpRequest, httpResponse);
			break;
		default:
			handleNotAllowedRequest(httpResponse);
	}
}

function handlePostRequest(httpRequest, httpResponse) {
	var newApplication = getRequestBody(httpRequest);
    // TODO Validate the body!

	applications.deploy(newApplication.applicationTemplateId, newApplication.name);

	sendResponse(httpResponse, httpResponse.CREATED);
}

function handleNotAllowedRequest(httpResponse) {
	sendResponse(httpResponse, httpResponse.METHOD_NOT_ALLOWED);
}

function getRequestBody(httpRequest) {
	try {
		return JSON.parse(httpRequest.readInputText());
	} catch (e) {
		return null;
	}
}

function sendResponse(response, status, contentType, content) {
	response.setStatus(status);
	response.setContentType(contentType);
	response.println(content);
	response.flush();
	response.close();	
}