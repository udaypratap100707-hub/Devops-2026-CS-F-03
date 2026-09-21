pipeline {
    agent any

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Check Docker') {
            steps {
                bat '''
                    echo Checking Docker...
                    docker version
                    docker ps
                '''
            }
        }

    }
}