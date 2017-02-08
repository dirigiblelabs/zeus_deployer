/* globals $ */
/* eslint-env node, dirigible */

var request = require('net/http/request');
var response = require('net/http/response');

var templates = require('zeus/templates/utils/templates');
var generator = require('zeus/templates/utils/generator');
var cluster = require('zeus/utils/cluster');

var kubernetesDeployments = require('kubernetes/deployments').getApi();
var kubernetesServices = require('kubernetes/services').getApi();

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

	var clusterSettings = cluster.getSettings();
	var server = clusterSettings.server;
	var namespace = clusterSettings.namespace;
	var token = clusterSettings.token;
    
    var applicationTemplate = templates.getApplicationTemplate(newApplication.applicationTemplateId);
    var generatedBody = generator.generate(newApplication.name, applicationTemplate, namespace); 
    
    for (var i = 0; i < generatedBody.deployments.length; i ++) {
        var deploymentBody = generatedBody.deployments[i];
        var deploymentResponse = kubernetesDeployments.create(server, token, namespace, deploymentBody);
        // TODO Something with the response
        console.log(JSON.stringify(deploymentResponse));
    }
    for (var i = 0; i < generatedBody.services.length; i ++) {
        var serviceBody = generatedBody.services[i];
        var serviceResponse = kubernetesServices.create(server, token, namespace, serviceBody);
        // TODO Something with the response
        console.log(JSON.stringify(serviceResponse));
    }
    cluster.afterCreateApplication(newApplication);
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
