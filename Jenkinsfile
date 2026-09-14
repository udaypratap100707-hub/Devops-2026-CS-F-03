pipeline {
    agent any

    stages {

        stage('Checkout') {
            steps {
                echo '======================================'
                echo 'CHECKING OUT FEATURE/FEEDBACK BRANCH'
                echo '======================================'

                git branch: 'feature/feedback',
                    url: 'https://github.com/udaypratap100707-hub/Devops-2026-CS-F-03.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                echo '======================================'
                echo 'INSTALLING DEPENDENCIES'
                echo '======================================'

                bat '''
                    cd src
                    npm install
                '''
            }
        }

        stage('Run Tests') {
            steps {
                echo '======================================'
                echo 'RUNNING TESTS'
                echo '======================================'

                bat '''
                    cd src
                    npm test
                '''
            }
        }

        stage('Feedback') {
            steps {
                echo '======================================'
                echo 'FEEDBACK CI RESULT'
                echo '======================================'

                echo 'Feedback feature CI validation completed successfully!'
                echo 'Branch: feature/feedback'
                echo 'Status: PASSED'
            }
        }
    }

    post {
        success {
            echo '======================================'
            echo 'BUILD SUCCESSFUL ✅'
            echo '======================================'
        }

        failure {
            echo '======================================'
            echo 'BUILD FAILED ❌'
            echo 'Check Console Output for the error.'
            echo '======================================'
        }
    }
}