/* globals $ */
/* eslint-env node, dirigible */

var templates = require('zeus/templates/utils/templates');
var generator = require('zeus/templates/utils/generator');
var cluster = require('zeus/utils/cluster');

var kubernetesDeployments = require('kubernetes/deployments');
var kubernetesServices = require('kubernetes/services');
var kubernetesIngresses = require('kubernetes/ingresses');
var kubernetesReplicaSets = require('kubernetes/replicasets');
var kubernetesPods = require('kubernetes/pods');

var kubernetesIngressUtils = require('kubernetes/utils/ingress');

exports.deploy = function(applicationTemplateId, applicationName, ingress) {
	if (!applicationTemplateId) {
		throw new Error('Missing applicationTemplateId!');
	} else if (!applicationName) {
		throw new Error('Missing applicationName!');
	}

	var clusterSettings = cluster.getSettings();
	var server = clusterSettings.server;
	var namespace = clusterSettings.namespace;
	var token = clusterSettings.token;

    var applicationTemplate = templates.getApplicationTemplate(applicationTemplateId);
    var generatedBody = generator.generate(applicationName, applicationTemplate, namespace); 

	createDeployments(server, token, namespace, generatedBody.deployments);
	createServices(server, token, namespace, generatedBody.services);

	var application = {
    	'applicationTemplateId': applicationTemplateId,
    	'name': applicationName,
    	'application_name': applicationName
    };

	if (ingress) {
		addIngress(server, token, namespace, application, ingress);
	}

    cluster.afterCreateApplication(application);

    return application;
};

function addIngress(server, token, namespace, application, ingress) {
	var ingressObject = kubernetesIngressUtils.getObject(ingress.name, ingress.namespace, ingress.labels, ingress.host, ingress.path, ingress.serviceName, ingress.servicePort);
	kubernetesIngresses.create(server, token, namespace, ingressObject);

	application.url = 'http://' + ingress.host;
	application.isDevInstance = ingress.isDevInstance;
}

exports.undeploy = function(applicationName) {
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
};

function createDeployments(server, token, namespace, deployments) {
	for (var i = 0; i < deployments.length; i ++) {
        var deploymentResponse = kubernetesDeployments.create(server, token, namespace, deployments[i]);
        // TODO Something with the response?
        // TODO Validate and throw Error?
        console.log(JSON.stringify(deploymentResponse));
    }
}

function createServices(server, token, namespace, services) {
	for (var i = 0; i < services.length; i ++) {
        var serviceBody = services[i];
        var serviceResponse = kubernetesServices.create(server, token, namespace, serviceBody);
        // TODO Something with the response?
        // TODO Validate and throw Error?
        console.log(JSON.stringify(serviceResponse));
    }
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
