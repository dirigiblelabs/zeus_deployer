/* globals $ */
/* eslint-env node, dirigible */

var request = require('net/http/request');
var response = require('net/http/response');
var xss = require('utils/xss');

var cluster = require('zeus/utils/cluster');

var kubernetesIngresses = require('kubernetes/ingresses');
var kubernetesServices = require('kubernetes/services');
var kubernetesDeployments = require('kubernetes/deployments');
var kubernetesReplicaSets = require('kubernetes/replicasets');
var kubernetesPods = require('kubernetes/pods');

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

	if (!applicationName) {
		throw new Error('Missing applicationName!');
	}
	var clusterSettings = cluster.getSettings();
	var server = clusterSettings.server;
	var namespace = clusterSettings.namespace;
	var token = clusterSettings.token;

	deleteIngresses(server, token, namespace, applicationName);
	deleteServices(server, token, namespace, applicationName);
	deleteDeployments(server, token, namespace, applicationName);
	deleteReplicaSets(server, token, namespace, applicationName);
	deletePods(server, token, namespace, applicationName);

	cluster.afterDeleteApplication(applicationName);

	sendResponse(httpResponse, httpResponse.NO_CONTENT);
}

function deleteIngresses(server, token, namespace, applicationName) {
	var ingresses = kubernetesIngresses.list(server, token, namespace, getLabelSelector(applicationName));
	for (var i = 0 ; i < ingresses && ingresses.length; i ++) {
		kubernetesIngresses.delete(server, token, namespace, ingresses[i].metadata.name);
	}
}

function deleteServices(server, token, namespace, applicationName) {
	var services = kubernetesServices.list(server, token, namespace, getLabelSelector(applicationName));
	for (var i = 0 ; i < services && services.length; i ++) {
		kubernetesServices.delete(server, token, namespace, services[i].metadata.name);
	}
}


function deleteDeployments(server, token, namespace, applicationName) {
	var deployments = kubernetesDeployments.list(server, token, namespace, getLabelSelector(applicationName));
	for (var i = 0 ; i < deployments && deployments.length; i ++) {
		kubernetesDeployments.delete(server, token, namespace, deployments[i].metadata.name);
	}
}

function deleteReplicaSets(server, token, namespace, applicationName) {
	var replicasets = kubernetesReplicaSets.list(server, token, namespace, getLabelSelector(applicationName));
	for (var i = 0 ; i < replicasets && replicasets.length; i ++) {
		kubernetesReplicaSets.delete(server, token, namespace, replicasets[i].metadata.name);
	}
}

function deletePods(server, token, namespace, applicationName) {
	var pods = kubernetesPods.list(server, token, namespace, getLabelSelector(applicationName));
	for (var i = 0 ; i < pods && pods.length; i ++) {
		kubernetesPods.delete(server, token, namespace, pods[i].metadata.name);
	}
}

function getLabelSelector(applicationName) {
	return {
		'labelSelector': 'applicationName=' + applicationName
	};
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
