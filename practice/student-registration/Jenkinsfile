pipeline {
    agent any

    stages {

        stage('Checkout') {
            steps {
                echo 'Checking out source code...'
            }
        }

        stage('Build Docker Image') {
            steps {
                bat 'docker build -t student-registration .'
            }
        }

        stage('Stop Old Container') {
            steps {
                bat 'docker rm -f student-registration >nul 2>&1 || exit /b 0'
            }
        }

        stage('Run Docker Container') {
            steps {
                bat 'docker run -d -p 3000:3000 -v "%WORKSPACE%\\data:/app/data" --name student-registration student-registration'
            }
        }

        stage('Verify Container') {
            steps {
                bat 'docker ps'
                bat 'docker logs student-registration'
            }
        }
    }

    post {
        success {
            echo '=========================================='
            echo ' Deployment Successful!'
            echo ' Student Registration Portal is running.'
            echo '=========================================='
        }

        failure {
            echo 'Deployment failed. Check the Jenkins console output.'
        }
    }
}
