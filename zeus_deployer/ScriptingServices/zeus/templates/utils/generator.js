/* globals $ */
/* eslint-env node, dirigible */

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
	var deployment = {
		"kind": "Deployment",
	    "apiVersion": "extensions/v1beta1",
	    "metadata": {
	        "name": name,
	        "namespace": namespace,
	        "labels": {
	            "applicationName": applicationName,
	            "deploymentTemplateName": deploymentTemplate.name
	        }
	    },
	    "spec": {
	        "replicas": deploymentTemplate.replicas,
	        "selector": {
	            "matchLabels": {
	                "applicationName": applicationName,
	                "deploymentTemplateName": deploymentTemplate.name
	            }
	        },
	        "template": {
	            "metadata": {
	                "labels": {
	                	"applicationName": applicationName,
	                	"deploymentTemplateName": deploymentTemplate.name
	                }
	            },
	            "spec": {
	                "containers": [
	                ]
                }
            }
        }
	};
	for (var i = 0 ; i < deploymentTemplate.containers.length; i ++) {
		var container = deploymentTemplate.containers[i];
		deployment.spec.template.spec.containers.push({
			"name": name,
			"image": container.image,
			"ports": [{
				"containerPort": container.port,
				"protocol": container.protocol
			}]
		});
	}
	return deployment;
}

function getServiceBody(serviceTemplate, applicationName, namespace, deploymentTemplateName) {
	var name = applicationName + '-' + serviceTemplate.name;
	return {
	    "kind": "Service",
	    "apiVersion": "v1",
	    "metadata": {
	    	"name": name,
    		"namespace": namespace,
    		"labels": {
	            "applicationName": applicationName,
	            "deploymentTemplateName": deploymentTemplateName
	        }
	    },
	    "spec": {
	        "selector": {
                "applicationName": applicationName,
                "deploymentTemplateName": deploymentTemplateName
	        },
	        "ports": [{
	        	"port": serviceTemplate.port
	        }],
	        "type": serviceTemplate.type
	    }
	};
}
