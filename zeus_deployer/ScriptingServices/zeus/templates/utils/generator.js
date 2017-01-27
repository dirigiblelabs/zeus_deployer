/* globals $ */
/* eslint-env node, dirigible */

var kubernetesServiceUtils = require('kubernetes/utils/service');
var kubernetesDeploymentUtils = require('kubernetes/utils/deployment');
var kubernetesContainerUtils = require('kubernetes/utils/container');

exports.generate = function(applicationName, applicationTemplate, namespace) {
	var body = {
		'deployments': [],
		'services': []
	};
	for (var i = 0; i < applicationTemplate.deployments.length; i ++) {
		var deploymentTemplate = applicationTemplate.deployments[i];
		var deploymentBody = getDeploymentBody(deploymentTemplate, applicationName, namespace);
		body.deployments.push(deploymentBody);
		for (var j = 0 ; j < applicationTemplate.deployments[i].services.length; j ++) {
			var serviceTemplate = applicationTemplate.deployments[i].services[j];
			var serviceBody = getServiceBody(serviceTemplate, applicationName, namespace, deploymentTemplate.name);
			body.services.push(serviceBody);
		}
	}
	return body;
};

function getDeploymentBody(deploymentTemplate, applicationName, namespace) {
	var name = applicationName + '-' + deploymentTemplate.name;
    var labels = {
        'applicationName': applicationName,
        'deploymentTemplateName': deploymentTemplate.name
    };
    var matchLabels = {
        'applicationName': applicationName,
        'deploymentTemplateName': deploymentTemplate.name
    };
    var replicas = deploymentTemplate.replicas;
    var containers = [];
	for (var i = 0 ; i < deploymentTemplate.containers.length; i ++) {
		var container = deploymentTemplate.containers[i];
		var ports = [];
		ports.push(kubernetesContainerUtils.getPort(container.protocol, container.port));
		containers.push(kubernetesContainerUtils.getObject(name, container.image, ports));
	}
	return kubernetesDeploymentUtils.getObject(name, namespace, labels, matchLabels, replicas, containers);
}


function getServiceBody(serviceTemplate, applicationName, namespace, deploymentTemplateName) {
	var name = applicationName + '-' + serviceTemplate.name;
	var labels = {
		'applicationName': applicationName,
		'deploymentTemplateName': deploymentTemplateName
	};
	var selector = {
		'applicationName': applicationName,
		'deploymentTemplateName': deploymentTemplateName
	};
	var ports =[];
	ports.push(kubernetesServiceUtils.getPort(serviceTemplate.port));
	var type = serviceTemplate.type;
	
	return kubernetesServiceUtils.getObject(name, namespace, labels, selector, ports, type);
}