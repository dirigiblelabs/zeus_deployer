/* globals $ */
/* eslint-env node, dirigible */

var request = require('net/http/request');
var response = require('net/http/response');
var xss = require('utils/xss');

var cluster = require('zeus/utils/cluster');
var kubernetesDeployments = require('kubernetes/deployments');

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
		case 'GET': 
			handleGetRequest(httpRequest, httpResponse, xss);
			break;
		default:
			handleNotAllowedRequest(httpResponse);
	}
}

function handleGetRequest(httpRequest, httpResponse) {
	var clusterSettings = cluster.getSettings();

	var deployments = kubernetesDeployments.list(clusterSettings.server, clusterSettings.token, clusterSettings.namespace, getQueryOptions(httpRequest));

	addClusterInfo(deployments, clusterSettings);
	sendResponse(httpResponse, httpResponse.OK, 'application/json', JSON.stringify(deployments));
}

function addClusterInfo(deployments, clusterSettings) {
	for (var i = 0 ; i < deployments && deployments.length; i ++) {
		deployments[i].server = clusterSettings.server;
	}
}

function getQueryOptions(httpRequest) {
	var queryOptions = {};
	var applicationName = xss.escapeSql(httpRequest.getParameter('applicationName'));
	if (applicationName) {
		queryOptions.labelSelector = 'applicationName=' + applicationName;
	}
	return queryOptions;
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
