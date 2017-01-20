/* globals $ */
/* eslint-env node, dirigible */

var applicationDao = require('zeus/templates/dao/applicationDao');
var deploymentDao = require('zeus/templates/dao/deploymentDao');
var deploymentContainersDao = require('zeus/templates/dao/deploymentContainersDao');
var servicesDao = require('zeus/templates/dao/servicesDao');
var containersDao = require('zeus/templates/dao/containersDao');

exports.getApplicationTemplate = function(applicationTemplateId) {
	var applicationTemplate = {};
	validateApplicationTemplateId(applicationTemplateId);
	var deployments = deploymentDao.list(null, null, null, null, applicationTemplateId);
	validateDeployments(deployments, applicationTemplateId);

	for (var i = 0 ; i < deployments.length; i ++) {
		var deploymentTemplateId = deployments[i].id;
		var deploymentContainers = deploymentContainersDao.list(null, null, null, null, deploymentTemplateId);
		deployments[i].containers = [];
		console.log(deploymentContainers);
		for (var j = 0 ; j < deploymentContainers.length; j ++) {
			var container = containersDao.get(deploymentContainers[j].container_template_id);
			deployments[i].containers.push(container);
		}
		deployments[i].services = servicesDao.list(null, null, null, null, deployments[i].id, true);
	}
	applicationTemplate.deployments = deployments;
	return applicationTemplate;
};

function validateApplicationTemplateId(applicationTemplateId) {
	if (!applicationDao.get(applicationTemplateId)) {
		throw new Error('No application template found with ID = [' + applicationTemplateId + ']');
	}
}

function validateDeployments(deployments, applicationTemplateId) {
	if (!deployments || deployments === []) {
		throw new Error('No deployment templates found with APPLICATION_TEMPLATE_ID = [' + applicationTemplateId + ']');
	}
}
