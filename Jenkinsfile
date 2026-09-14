pipeline {

    agent any

    stages {

        stage('Checkout') {
            steps {
                echo 'Checking out source code...'
                checkout scm
            }
        }

        stage('Check Feedback Files') {
            steps {
                bat '''
                    echo Checking feedback folder...

                    if not exist feedback (
                        echo ERROR: feedback folder not found
                        exit /b 1
                    )

                    if not exist feedback\\feedback.html (
                        echo ERROR: feedback.html not found
                        exit /b 1
                    )

                    if not exist feedback\\feedback.css (
                        echo ERROR: feedback.css not found
                        exit /b 1
                    )

                    if not exist feedback\\feedback.js (
                        echo ERROR: feedback.js not found
                        exit /b 1
                    )

                    if not exist feedback\\feedback.json (
                        echo ERROR: feedback.json not found
                        exit /b 1
                    )

                    echo All feedback files found successfully.
                '''
            }
        }

        stage('Check HTML') {
            steps {
                bat '''
                    findstr /C:"<form" feedback\\feedback.html
                    findstr /C:"feedback.js" feedback\\feedback.html
                    findstr /C:"feedback.css" feedback\\feedback.html

                    echo HTML validation passed.
                '''
            }
        }

        stage('Check JavaScript') {
            steps {
                bat '''
                    node --check feedback\\feedback.js

                    echo JavaScript syntax check passed.
                '''
            }
        }

        stage('Check JSON') {
            steps {
                bat '''
                    node -e "JSON.parse(require('fs').readFileSync('feedback/feedback.json', 'utf8')); console.log('JSON validation passed.')"
                '''
            }
        }

        stage('Install Project Dependencies') {
            steps {
                bat '''
                    if exist src\\frontend\\package.json (
                        cd src\\frontend
                        npm install
                    ) else (
                        echo package.json not found - skipping npm install
                    )
                '''
            }
        }

    }

    post {

        success {
            echo '======================================'
            echo 'FEEDBACK CI BUILD SUCCESSFUL'
            echo '======================================'
        }

        failure {
            echo '======================================'
            echo 'FEEDBACK CI BUILD FAILED'
            echo '======================================'
        }
    }
}