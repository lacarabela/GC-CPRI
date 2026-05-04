# Dataset Documentation
## Introduction:
This document is tracking all of the different datasets that were utilized during the course of the GC-CPRI for the semester of Spring 2026. It goes over the datasets source, and each of the .csv's utilized. It also goes over the columns, and how they can be used.

## Alabama Secretary of State
### About the Source:
This is the most reliable source for Alabama voting data, as they are an office designed around: clarifying votes, counting ballots, and managing voter registration across the different counties. They also help notarize important information for the governor of the state. They offer many different datasets regarding the votes across all the elections back until 1946. They cover different things such as race, voter registration statistics, and characteristics of voters.

### 2020/2024 General Election Participation by Age.csv
#### Relevance: 
The data taken here is relevant because it showcases the age range of the people who are voting. This is relevant because it helps add another indicator of risk to the matrix, but also because it showcases something important about the voting turnout, who is voting. Age is one factor that gives a very easy and clear image of the person voting, its easy to group and identify. Knowing ages can help also show gaps in who is and isn’t voting at a time as well. 

#### Columns: 
First column is the total ballots cast, and then the proceeding columns are different amounts of votes cast based on age of voter. It covers 11 years at a time, for example: 18-29. The rows are just based on the different counties, differentiating what ages voted in which counties.

### 2020/2024 General Election Participation by Gender.csv
#### Relevance: 
Understanding risks to voting comes down to many factors, however, something that can shine a lot of light on whose voting and not is gender. Alone, it may not say much, but when taken in conjunction with other factors, such as transport and age, it helps paint specific pictures and draw conclusions that are necessary to help policy makers. It is relevant because it creates an image of who voted in one social context compared to another. It also helps reveal a pattern of why specific gender might vote. Even alone, it can be used in comparison to upcoming policies and elected officials, using gender against the near political future.

#### Columns: 
The first column of the data is the different counties that are being taken into the index. The second column is the total number of ballots cast. The final three columns are the different genders that voted in the election, going from female, to male, to unidentified voters.

### 2020/2024 General Election Participation by Race.csv
#### Relevance: 
Race plays a key factor in voting, or not. One of the most important parts about a person and their circumstances in life are based on their race, and one of the things that determine risk or lack thereof in voting is someone's circumstances in life. It determines their willingness to vote, and what for. An example being, that it is likely that someone of one race would vote for a party or official that represents them, or is willing to aid them. Certain political tensions or contexts also affect the people who vote, based on their race. Overall race is very relevant to the participation of elections, because it's a key factor in voting or not voting based on an inert quality of an individual.


#### Columns: 
The first column is the different counties that are being used from the dataset. And the proceeding columns are the total ballots and the different races that participated in the election.

### 2024 General Election Total Ballots Cast.csv
#### Relevance:
Having a total count of casted ballots gives way to a larger scale image of how many people voted, and is then broken down into different voters based on parties, and returning voters. The broken down data helps give a more sharper image when used with the other information available. For example, having the total number of registered voters, and the actual votes cast helps show the amount of people who did not vote despite clearly intending too. Or the column for returning voters, it shows who returned to vote. However, when put with other data from the different data sets that are being taken into the PCA alongside the broken down data such as political groups and registered voters, conclusions can be extrapolated and used further.

#### Columns:
The first column is the different counties that are being used in the calculation. The different columns outside of the first one are: registered voters, democrat ballots, republican ballots, absentee ballots, turnouts of returning voters.

## U.S. DEPARTMENT OF AGRICULTURE Economic Research
### About the Source:
This is a federal agency whose sole purpose is to conduct statistical research on economic factors. Given their federal status and their objective mission, they help provide clear pictures on economic factors that can be taken account of during the statistical process of this project.

### Educational attainment for adults age 25 and older for the United States, States, and counties, 1970–2023.csv
#### Relevance:
When it comes to voting something really  important to take into consideration is the educational status of the individuals who can vote. This set of data gives a picture of the attained education of the different counties being analyzed for this project. It tells things like: percentage of high school graduates, percentage of people with a bachelor's degree, those with four or more years of college. It gives a comprehensive picture of the educational background of the people who are voting or not, on a county by county basis.

#### Columns:
The first two columns are the code of the county, and the county of interest. The last two columns are an educational attribute, with a column to its right which gives a value to how many people or a percentage of people have that attribute.

### Population estimates for the United States, States, and counties, 2020–23.csv
#### Relevance:
Population estimates help create a statistical representation of the amount of people in an area. This information is important because it can be used in conjunction with other pieces of data, such as putting it against registered voters and actual voters, this would see how many people of a total population in a county vote. It's an important statistic overall because it opens up multiple avenues of calculations and data visualization. Despite being estimates, the USDA spends a lot of time and resources to be as accurate as possible. Overall though, having total populations really does help with a risk index, giving a large overreaching number to work under

#### Columns:
The first column consists of different FIPS codes, also known as Federal Information Processing Standards, which serve as an identifier for different counties. After that is the state name in a two letter prefix. In the third column is the county name, serving as another identifier, it is also grouped with one county repeating several times. After the third column is the attribute, which is an attribute attached to the county it's on the same row of. A single county can have multiple attributes hence why they are grouped together in different columns. In the final column is the value attached to each attribute, this is the prevalence of the attribute in the county. Each value is its own metric and is measured based on the context of the attribute it represents.

### Unemployment and median household income for the United States, States, and counties, 2000–23.csv
#### Relevance:
Some of the most important parts of political elections is the state of the economy, whether it is federal or in this case local. The state of the economy influences peoples income and unemployment status, two things which sway or cause voting for many voter. Firstly, Income helps create a framework for the capability to gain things like: education, decision-making capabilities, and information synthesis. The lower the income, the lesser chance for someone to be able to have each of these factors, however, the higher the income, the opposite takes place. Income is directly related to voters and voting because political agendas also take into account economic changes and the state of the economy at that moment. 

Secondly, unemployment is another important factor when it comes to voters because unemployment influences income and what policies that a voter cares for based on the running political parties.

#### Columns:
The rows are grouped up by the county, so multiple counties will be there. The first three columns are the different identifiers of the counties, being the FIPS code, state, and the county name. The last two columns are the attribute and the value. The attribute is the different descriptor of what describes unemployment or median household income. The value has to be taken into the context of the attribute, such as one of the attributes is a code, and so the value will be the code that the attribute refers too. Another attribute is the “civilian_labor_force”, which gives a raw numeric value to the amount of civilians working within a county.