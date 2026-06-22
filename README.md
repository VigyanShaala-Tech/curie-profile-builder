# Curie Profile Builder Data Structure

Please find the standardized column header structure for the **Curie Profile Builder** data below.

## Reference Documents

The following documents should be used as the source of truth while implementing or validating the Curie Profile Builder data structure:

* **Frontend Documentation:** [[`App(Frontend) structure documentation.docx`]](https://vigyanshaala-my.sharepoint.com/:w:/p/akshata_satpute/IQDrs_mIAG0PQLSoCpbwWpQZAZlcYqGa_jrhGb9Aeb8VGu8?e=2Q5kEH)
* **Google Sheet:** [`curie_profile_builder_data`](https://docs.google.com/spreadsheets/d/1mZ0guLHSDuWVydpOVOWGMw9dB7LO-oy63cN-n41PXX8/edit?usp=sharing)
* **Hierarchical Schema:** Tree representation of the complete profile structure for easier understanding of the nested JSON fields.

---

## Hierarchical Structure

```text
key
first_name
last_name

identity
├── gender
├── email
└── current_location
    ├── city
    ├── state
    └── country

academics
├── academic_status
├── degree
├── year_of_study
├── graduation_year
├── stream
├── subject_area
├── subject_specialization
├── institution
└── cgpa_or_percent

skills_interests
├── subject_knowledge
├── tech_tools_and_it_skills
├── ai_and_data_skills
├── professional_skills
└── academic_interests

milestones
├── projects
│   ├── name
│   ├── status
│   └── details
├── exams
└── certifications

reflections
├── purpose
├── strengths
├── challenges
├── actions
├── opportunities
└── barriers

profile
├── first_name
├── last_name
├── gender
├── email
├── current_location
│   ├── city
│   ├── state
│   └── country
├── academic_status
├── degree
├── year_of_study
├── graduation_year
├── stream
├── subject_area
├── subject_specialization
├── institution
├── cgpa_or_percent
├── subject_knowledge
├── tech_tools_and_it_skills
├── ai_and_data_skills
├── professional_skills
├── academic_interests
├── projects
│   ├── name
│   ├── status
│   └── details
├── exams
├── certifications
├── purpose
├── strengths
├── challenges
├── actions
├── opportunities
└── barriers

user_type
```

---

## Notes

* All subfields are stored as JSON objects under their respective main sections (e.g., identity, academics, skills_interests, milestones, reflections, and profile). This structure groups related information together, making the data easier to manage, extend, and consume across the frontend, backend, and APIs.
* The `profile` object represents a consolidated view of the user's information by combining fields from the `identity`, `academics`, `skills_interests`, `milestones`, and `reflections` sections.
* This structure should be treated as the **source of truth** for frontend, backend, database, and API implementations.
* Any future additions or modifications to the schema should be reflected consistently across the documentation, Google Sheet, and application codebase.
