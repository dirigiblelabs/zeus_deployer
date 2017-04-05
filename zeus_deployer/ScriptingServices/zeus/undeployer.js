/* globals $ */
/* eslint-env node, dirigible */

var request = require('net/http/request');
var response = require('net/http/response');
var xss = require('utils/xss');
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
		case 'DELETE': 
			handleDeleteRequest(httpRequest, httpResponse, xss);
			break;
		default:
			handleNotAllowedRequest(httpResponse);
	}
}

function handleDeleteRequest(httpRequest, httpResponse, xss) {
	var applicationName = xss.escapeSql(httpRequest.getParameter('applicationName'));

	applications.undeploy(applicationName);

	sendResponse(httpResponse, httpResponse.NO_CONTENT);
}


function handleNotAllowedRequest(httpResponse) {
	sendResponse(httpResponse, httpResponse.METHOD_NOT_ALLOWED);
}

function sendResponse(response, status, contentType, content) {
	response.setStatus(status);
	response.setContentType(contentType);
	response.println(content);
	response.flush();
	response.close();	
}
