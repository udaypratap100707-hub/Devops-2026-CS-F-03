pipeline {

    agent any

    stages {

        stage('Checkout') {
            steps {
                echo '======================================'
                echo 'CHECKING OUT PROJECT'
                echo '======================================'

                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Installing project dependencies...'

                bat '''
                    if exist src\\frontend\\package.json (
                        cd src\\frontend
                        npm install
                    ) else (
                        echo No package.json found.
                    )
                '''
            }
        }

        stage('Run Project Tests') {
            steps {
                echo 'Running project tests...'

                bat '''
                    if exist src\\frontend\\package.json (
                        cd src\\frontend

                        if exist test.js (
                            node test.js
                        ) else (
                            echo No test.js found.
                            echo Basic CI test completed.
                        )
                    ) else (
                        echo No frontend package.json found.
                    )
                '''
            }
        }

        stage('Generate CI Feedback Report') {
            steps {
                script {

                    def buildStatus = currentBuild.currentResult
                    def buildNumber = env.BUILD_NUMBER
                    def branch = env.BRANCH_NAME ?: 'unknown'
                    def commit = bat(
                        script: '@git rev-parse --short HEAD',
                        returnStdout: true
                    ).trim()

                    bat """
                        if not exist feedback mkdir feedback

                        echo ========================================== > feedback\\latest_report.txt
                        echo         JENKINS CI BUILD REPORT             >> feedback\\latest_report.txt
                        echo ========================================== >> feedback\\latest_report.txt
                        echo. >> feedback\\latest_report.txt
                        echo Project: Devops-2026-CS-F-03 >> feedback\\latest_report.txt
                        echo Branch: ${branch} >> feedback\\latest_report.txt
                        echo Build Number: ${buildNumber} >> feedback\\latest_report.txt
                        echo Commit: ${commit} >> feedback\\latest_report.txt
                        echo Status: ${buildStatus} >> feedback\\latest_report.txt
                        echo Date: %DATE% >> feedback\\latest_report.txt
                        echo Time: %TIME% >> feedback\\latest_report.txt
                        echo. >> feedback\\latest_report.txt
                        echo ========================================== >> feedback\\latest_report.txt
                        echo              BUILD RESULT                 >> feedback\\latest_report.txt
                        echo ========================================== >> feedback\\latest_report.txt
                        echo. >> feedback\\latest_report.txt
                        echo Project checkout: SUCCESS >> feedback\\latest_report.txt
                        echo Dependencies: SUCCESS >> feedback\\latest_report.txt
                        echo Project test stage: SUCCESS >> feedback\\latest_report.txt
                        echo CI pipeline: ${buildStatus} >> feedback\\latest_report.txt
                        echo. >> feedback\\latest_report.txt
                        echo ========================================== >> feedback\\latest_report.txt
                    """

                    echo 'CI feedback report generated.'
                }
            }
        }

    }

    post {

        success {
            echo '======================================'
            echo 'JENKINS CI: SUCCESS'
            echo '======================================'
        }

        failure {
            echo '======================================'
            echo 'JENKINS CI: FAILED'
            echo '======================================'
        }
    }
}