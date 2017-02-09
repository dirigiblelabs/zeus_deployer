/* globals $ */
/* eslint-env node, dirigible */

var request = require('net/http/request');
var response = require('net/http/response');
var xss = require('utils/xss');

var cluster = require('zeus/utils/cluster');
var kubernetesIngresses = require('kubernetes/ingresses');
var kubernetesIngressUtils = require('kubernetes/utils/ingress');

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

	var ingresses = kubernetesIngresses.list(clusterSettings.server, clusterSettings.token, clusterSettings.namespace, getQueryOptions(httpRequest, xss));

	sendResponse(httpResponse, httpResponse.OK, 'application/json', JSON.stringify(ingresses));
}

function handlePostRequest(httpRequest, httpResponse) {
	var clusterSettings = cluster.getSettings();

	var body = getRequestBody(httpRequest);
	var name = body.name;
	var namespace = body.namespace; // TODO This could be replaced with `clusterSettings.namespace`, as the mapping between HCP Accounts & K8S Namespaces is 1:1
	var labels = {
		'applicationName': body.applicationName
	};
	var host = body.host;
	var path = body.path;
	var serviceName = body.serviceName;
	var servicePort = body.servicePort;

	var ingress = kubernetesIngressUtils.getObject(name, namespace, labels, host, path, serviceName, servicePort);
	try {
		kubernetesIngresses.create(clusterSettings.server, clusterSettings.token, clusterSettings.namespace, ingress);
		sendResponse(httpResponse, httpResponse.CREATED);
	} catch (e) {
		sendResponse(httpResponse, httpResponse.BAD_REQUEST, 'application/json', JSON.stringify(e));
	}
}

function handlePutRequest(httpRequest, httpResponse) {
	var clusterSettings = cluster.getSettings();

	var name = getNameParameter(httpRequest, xss);
	var updatedIngress = getRequestBody(httpRequest);
	try {
		kubernetesIngresses.update(clusterSettings.server, clusterSettings.token, clusterSettings.namespace, name, updatedIngress);
		sendResponse(httpResponse, httpResponse.NO_CONTENT);
	} catch (e) {
		sendResponse(httpResponse, httpResponse.BAD_REQUEST, 'application/json', JSON.stringify(e));
	}
}

function handleDeleteRequest(httpRequest, httpResponse, xss) {
	var clusterSettings = cluster.getSettings();
	var name = getNameParameter(httpRequest, xss);
	try {
		kubernetesIngresses.delete(clusterSettings.server, clusterSettings.token, clusterSettings.namespace, name);
		sendResponse(httpResponse, httpResponse.NO_CONTENT);
	} catch (e) {
		sendResponse(httpResponse, httpResponse.BAD_REQUEST, 'application/json', JSON.stringify(e));
	}
}

function getNameParameter(httpRequest, xss) {
	return xss.escapeSql(httpRequest.getParameter('name'));
}

function getQueryOptions(httpRequest, xss) {
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
