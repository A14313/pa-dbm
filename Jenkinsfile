@Library(["pluk-jenkins-cicd-library", "jenkins-pipeline-library"]) _

def G_CI_VAR = ['deployment-mapping': ['dev': ['name': 'pluk-payment-platform', 'appRef': 'pmw7de', 'location': 'az1']]]

pipeline {
  environment {
    E_IMAGE = "pa-payment-dbm"
    E_DEPLOYMENT_NAME = "pa-payment-dbm"
    E_AR_NAME = "docker-pluk-common"
  }
  agent { label 'phlife-pluk-az1-nprod-dind' }
  stages {
    stage("Setup") {
      steps {
        script {
            G_CI_VAR['branch-prefix'] = P_BRANCH.split('/')[0]
            G_CI_VAR['image-tag'] = ddocker.setImageName(artifactoryName: E_AR_NAME, image: E_IMAGE, branch: P_BRANCH, buildNumber: BUILD_NUMBER)
            G_CI_VAR['commit-msg'] = ggit.getLatestCommitMessage(branchPrefix: G_CI_VAR['branch-prefix'], project: P_PROJECT, validate: true)
            G_CI_VAR += jenkins.getCommitAction(branchPrefix: G_CI_VAR['branch-prefix'], commitMsg: G_CI_VAR['commit-msg'])
            G_CI_VAR['sast-agent'] = G_CI_VAR['isSastExecute'] ? 'gwisp-polaris-prd' : 'dind'
            jenkins.setBuildDescriptionForCiPipeline(branch: P_BRANCH, commitId: GIT_COMMIT, author: P_AUTHOR, sshUrl: GIT_URL,
                                                    image: G_CI_VAR['image-tag'], prId: P_PULL_REQUEST_ID, commitMsg: G_CI_VAR['commit-msg'])
        }
      }
	  }
    stage("Build Docker Image") {
      parallel {
          stage("docker-build") {
            steps {
              script {
                ddocker.build(imageTag: G_CI_VAR['image-tag'], branch: P_BRANCH, author: P_AUTHOR, commitId: GIT_COMMIT)
              }
            }
        }
      }
    }
    stage("Push Image to Artifactory") {
      when { expression { return G_CI_VAR['isImagePush'] } }
      steps {
        script {
          ddocker.push(imageTag: G_CI_VAR['image-tag'], registry: E_AR_NAME)
        }
      }
    }
    stage("Deploy to Environment") {
      when { expression { return G_CI_VAR['isAutoDeploy'] } }
      steps {
        script {
          kubectl.setImage(deploymentMapping: G_CI_VAR['deployment-mapping'], branchPrefix: G_CI_VAR['branch-prefix'],
                          deploymentName: E_DEPLOYMENT_NAME, image: G_CI_VAR['image-tag'], repository: JOB_BASE_NAME)
        }
      }
    }
    /*stage("Quality Testing and DevSecOps Scanning") {
      parallel {
        stage("Polaris Scan") {
          when { expression { return G_CI_VAR['isSastExecute'] } }
          agent { node { label G_CI_VAR['sast-agent']} }
          steps {
            script {
                polaris_scan_files = './'
                security.sastFortifyScan(appName: 'PLUK-PaymentPlatform-pa-payment-dbm', tags: 'WEB', scanFiles: "${polaris_scan_files}")
            }
          }
        }
        stage("oss-nexus-scan") {
          when { expression { return G_CI_VAR['isOssExecute'] } }
          steps {
            script {
              security.ossNexusScan(appId: 'PLUK-PaymentPlatform-pa-payment-dbm', path: "$WORKSPACE", stage: 'build')
            }
          }
        }
        stage("csec-aquasec-scan") {
          when { expression { return G_CI_VAR['isCsecExecute'] } }
          steps {
            script {
              security.csecAquasecScan(appName: 'PLUK-PaymentPlatform-pa-payment-dbm', image: G_CI_VAR['image-tag'])
            }
          }
        }
      }
    }
    stage("Trigger Pull Request") {
      when { expression { return G_CI_VAR['isForPromotionToDevelop'] } }
      steps {
        script {
            G_CI_VAR['promote-id'] = promoteBranchTo(branch: P_BRANCH, sshUrl: GIT_URL, author: P_AUTHOR,
                                                    commitId: GIT_COMMIT, destBranch: 'develop')
        }
      }
    }*/
  }
  post {
    always {
      script {
        eemail.sendNoticationForCi(branch: P_BRANCH, commitId: GIT_COMMIT, author: P_AUTHOR, image: G_CI_VAR['image-tag'], buildNumber: BUILD_NUMBER,
                                  buildUrl: BUILD_URL, result: currentBuild.result, prId: P_PULL_REQUEST_ID, sshUrl: GIT_URL, commitMsg: G_CI_VAR['commit-msg'],
                                  promoteId: G_CI_VAR.get('promote-id', 'None'))
        ddocker.remove(imageTag: G_CI_VAR['image-tag'])
      }
    }
  }
}