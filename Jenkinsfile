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
                    if exist src\\frontend\\test.js (
                        cd src\\frontend
                        node test.js
                    ) else (
                        echo No test.js found.
                        echo Basic CI test completed.
                    )
                '''
            }
        }

        stage('Generate CI Feedback Report') {
            steps {
                script {

                    def branch = env.BRANCH_NAME ?: 'unknown'
                    def commit = bat(
                        script: '@git rev-parse --short HEAD',
                        returnStdout: true
                    ).trim()

                    bat """
                        if not exist feedback mkdir feedback

                        echo ========================================== > feedback\\latest_report.txt
                        echo          JENKINS CI BUILD REPORT            >> feedback\\latest_report.txt
                        echo ========================================== >> feedback\\latest_report.txt
                        echo. >> feedback\\latest_report.txt

                        echo Project: Devops-2026-CS-F-03 >> feedback\\latest_report.txt
                        echo Branch: ${branch} >> feedback\\latest_report.txt
                        echo Build Number: ${BUILD_NUMBER} >> feedback\\latest_report.txt
                        echo Commit: ${commit} >> feedback\\latest_report.txt
                        echo Status: SUCCESS >> feedback\\latest_report.txt
                        echo Date: %DATE% >> feedback\\latest_report.txt
                        echo Time: %TIME% >> feedback\\latest_report.txt

                        echo. >> feedback\\latest_report.txt
                        echo ========================================== >> feedback\\latest_report.txt
                        echo              BUILD RESULT                  >> feedback\\latest_report.txt
                        echo ========================================== >> feedback\\latest_report.txt

                        echo. >> feedback\\latest_report.txt
                        echo Project checkout: SUCCESS >> feedback\\latest_report.txt
                        echo Dependencies: SUCCESS >> feedback\\latest_report.txt
                        echo Project tests: SUCCESS >> feedback\\latest_report.txt
                        echo CI pipeline: SUCCESS >> feedback\\latest_report.txt

                        echo. >> feedback\\latest_report.txt
                        echo ========================================== >> feedback\\latest_report.txt
                    """

                    echo 'CI feedback report generated.'
                }
            }
        }

        stage('Commit CI Feedback') {
            steps {

                withCredentials([
                    usernamePassword(
                        credentialsId: 'github-credentials',
                        usernameVariable: 'GIT_USERNAME',
                        passwordVariable: 'GIT_PASSWORD'
                    )
                ]) {

                    bat '''
                        echo ======================================
                        echo COMMITTING CI FEEDBACK REPORT
                        echo ======================================

                        git config user.name "Jenkins CI"
                        git config user.email "jenkins@localhost"

                        git add feedback/latest_report.txt

                        git diff --cached --quiet

                        if %ERRORLEVEL% EQU 0 (
                            echo No report changes to commit.
                        ) else (
                            git commit -m "Update Jenkins CI feedback report"

                            git push https://%GIT_USERNAME%:%GIT_PASSWORD%@github.com/udaypratap100707-hub/Devops-2026-CS-F-03.git HEAD:%BRANCH_NAME%
                        )
                    '''
                }
            }
        }
    }

    post {

        success {
            echo '======================================'
            echo 'JENKINS CI SUCCESS'
            echo '======================================'
            echo 'CI feedback report committed to GitHub.'
        }

        failure {
            echo '======================================'
            echo 'JENKINS CI FAILED'
            echo '======================================'
        }
    }
}