/* globals $ */
/* eslint-env node, dirigible */

var request = require('net/http/request');
var response = require('net/http/response');
var xss = require('utils/xss');

var cluster = require('zeus/utils/cluster');
var kubernetesNamespaces = require('kubernetes/namespaces');
var kubernetesNamespaceUtils = require('kubernetes/utils/namespace');

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
		case 'POST':
			handlePostRequest(httpRequest, httpResponse);
			break;
		case 'PUT':
			handlePutRequest(httpRequest, httpResponse);
			break;
		case 'DELETE':
			handleDeleteRequest(httpRequest, httpResponse, xss);
			break;
		default:
			handleNotAllowedRequest(httpResponse);
	}
}

function handleGetRequest(httpRequest, httpResponse, xss) {
	var clusterSettings = cluster.getSettings();

	var name = getNameParameter(httpRequest, xss);
	if (name) {
		var namespace = kubernetesNamespaces.get(clusterSettings.server, clusterSettings.token, name);
		sendResponse(httpResponse, httpResponse.OK, 'application/json', JSON.stringify(namespace));
	} else {
		var namespaces = kubernetesNamespaces.list(clusterSettings.server, clusterSettings.token);
		sendResponse(httpResponse, httpResponse.OK, 'application/json', JSON.stringify(namespaces));
	}
}

function handlePostRequest(httpRequest, httpResponse) {
	var clusterSettings = cluster.getSettings();

	var body = getRequestBody(httpRequest);
	var name = body.name;

	var namespace = kubernetesNamespaceUtils.getObject(name);
	try {
		kubernetesNamespaces.create(clusterSettings.server, clusterSettings.token, namespace);
		sendResponse(httpResponse, httpResponse.CREATED);
	} catch (e) {
		sendResponse(httpResponse, httpResponse.BAD_REQUEST, 'application/json', JSON.stringify(e));
	}
}

function handlePutRequest(httpRequest, httpResponse) {
	var clusterSettings = cluster.getSettings();

	var name = getNameParameter(httpRequest, xss);
	var updatedNamespace = getRequestBody(httpRequest);
	try {
		kubernetesNamespaces.update(clusterSettings.server, clusterSettings.token, name, updatedNamespace);
		sendResponse(httpResponse, httpResponse.NO_CONTENT);
	} catch (e) {
		sendResponse(httpResponse, httpResponse.BAD_REQUEST, 'application/json', JSON.stringify(e));
	}
}

function handleDeleteRequest(httpRequest, httpResponse, xss) {
	var clusterSettings = cluster.getSettings();
	var name = getNameParameter(httpRequest, xss);
	try {
		kubernetesNamespaces.delete(clusterSettings.server, clusterSettings.token, name);
		sendResponse(httpResponse, httpResponse.NO_CONTENT);
	} catch (e) {
		sendResponse(httpResponse, httpResponse.BAD_REQUEST, 'application/json', JSON.stringify(e));
	}
}

function getNameParameter(httpRequest, xss) {
	return xss.escapeSql(httpRequest.getParameter('name'));
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
