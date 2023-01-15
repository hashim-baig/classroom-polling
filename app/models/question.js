'use strict'

const question_types = ['multiple choice', 'multiple answer']

module.exports = (sequelize, DataTypes) => {
    const Question = sequelize.define('Question', {
        // the id column should be standardized across all models
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true
        },
        type: { // multiple choice only for now
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notNull: {
                    msg: "Question type must be provided"
                },
                notEmpty: {
                    msg: "Question type must be provided"
                },
                isIn: {
                    args: [question_types],
                    msg: "Question type must be a valid option"
                }
            }
        },
        stem: { // the stem is just the wording of the question being posed
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notNull: {
                    msg: "Question stem text must be provided"
                },
                notEmpty: {
                    msg: "Question stem text must be provided"
                }
            }
        },
        content: { // the JSON that is unique to each question type
            type: DataTypes.JSON,
            validate: {
                perTypeValidation(value) {
                    switch(this.type) {
                        case "multiple choice" || "multiple answer":
                            let options = value.options
                            if (options === null) { // the options object must exist
                                throw new Error(`${this.type} question must have options`)
                            }
                            let options_length = Object.keys(options).length < 2
                            if (options_length) { // there must be more than 2 options
                                throw new Error(`${this.type} question must have more than 1 option`)
                            }
                            let index = 0 // the options must be indexed increasing from 0
                            for (; index < options_length; index++) {
                                let option = options[index]
                                // the options must have more value than an empty or whitespace string
                                if (option === null || option.trim() === "") {
                                    throw new Error(`${this.type} question option must have a value`)
                                }
                            }
                            break
                        default:
                            throw new Error("question content validation failed unexpectedly")
                    }
                }
            }
        },
        answers: {
            type: DataTypes.JSON,
            validate: {
                perTypeValidation(value) {
                    switch(this.type) {
                        case "multiple choice" || "multiple answer":
                            const answers_length = Object.entries(value).length
                            if (answers_length != Object.entries(this.content.options).length) { //the answers object must have the same number of elements as the content 
                                throw new Error(`${this.type} question must have indication of correctness for each option`)
                            }
                            let true_answers = 0 
                            let index = 0 // the answers must be indexed increasing from 0
                            for (; index < answers_length; index++) {
                                let answer = value[index]
                                // the answer must be a true or false value
                                if (answer === null || typeof answer != "boolean") {
                                    throw new Error(`${this.type} question answer must have a boolean value`)
                                }
                                if (answer === true) {
                                    true_answers += 1
                                }
                            }
                            if (true_answers != 1 && this.type == "multiple choice") { // only one answer can be correct for multiple choice
                                throw new Error(`${this.type} question can only and must have 1 correct answer`)
                            }
                            break
                        default:
                            throw new Error("question answers validation failed unexpectedly")
                    }
                }
            }
        }
    },
    {
        timestamps: true
    })

    return Question
}

/* Question Type Documentation:

    Multiple Choice:

        content: {
            options: {
                1: "",
                2: "",
                3: "",
                4: "",
                ...
            }
        }

        answers: {
            1: false,
            2: true,
            3: false,
            4: false,
            ....
        }


*/