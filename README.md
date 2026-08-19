# TripTrack

<p align="center">
  <img src="https://img.shields.io/badge/TripTrack-Bus%20Tracking%20Application-196F31?style=for-the-badge" alt="TripTrack">
</p>

<p align="center">
  <strong>A Bus Tracking Mobile Application</strong>
</p>

<p align="center">
  Track buses in real time, view routes and stops, and make public transportation more convenient.
</p>

<p align="center">
  <a href="https://github.com/MuqaddasHaideri/tripTrack">
    <img src="https://img.shields.io/badge/GitHub-Repository-181717?style=flat-square&logo=github" alt="GitHub">
  </a>
  <img src="https://img.shields.io/github/stars/MuqaddasHaideri/tripTrack?style=flat-square&logo=github&label=Stars" alt="Stars">
  <img src="https://img.shields.io/github/commit-activity/m/MuqaddasHaideri/tripTrack?style=flat-square&logo=git&label=Activity" alt="Commit Activity">
  <img src="https://img.shields.io/github/last-commit/MuqaddasHaideri/tripTrack?style=flat-square&logo=git&label=Last%20Commit" alt="Last Commit">
</p>

---

## Overview

**TripTrack** is a mobile-based bus tracking application developed to improve the public transportation experience.

The application enables passengers to **track buses in real time, view routes and stops, check estimated arrival information, save favorite routes, and receive announcements**.

TripTrack also provides dedicated functionality for **drivers and administrators**, creating a complete transport management system.

---

## The Problem

Passengers often face long and uncertain waiting times because they have no reliable way to know:

* Where their bus currently is
* When the bus is expected to arrive
* Which route or stops the bus follows
* Whether a bus is currently active

**TripTrack** addresses these challenges by providing accessible real-time bus information through a mobile application.

---

## What TripTrack Offers

<table>
<tr>
<td width="33%" align="center">

### Passenger

Track and monitor buses while accessing useful route and arrival information.

</td>

<td width="33%" align="center">

### Driver

Manage shifts and share the bus's live GPS location.

</td>

<td width="33%" align="center">

### Admin

Manage routes, stops, announcements, and driver registrations.

</td>
</tr>
</table>

---

## Features

### Passenger

* View available buses on the map
* Track bus locations in real time
* View estimated arrival information
* View routes and stops
* Save favorite routes
* View static bus schedules
* Report transport-related issues
* Receive announcements

### Driver

* Start and manage a bus shift
* Share live GPS location
* View assigned routes
* Check active drivers
* Receive announcements

### Admin

* Add, edit, and delete routes
* Add, edit, and delete stops
* Manage announcements
* Approve or disapprove driver registrations
* Manage transport-related information

---

## Tech Stack

<table>
<tr>
<th>Technology</th>
<th>Purpose</th>
</tr>

<tr>
<td><strong>React Native</strong></td>
<td>Mobile application development</td>
</tr>

<tr>
<td><strong>Expo</strong></td>
<td>React Native development and tooling</td>
</tr>

<tr>
<td><strong>Node.js</strong></td>
<td>Backend runtime environment</td>
</tr>

<tr>
<td><strong>Express.js</strong></td>
<td>REST API development</td>
</tr>

<tr>
<td><strong>MongoDB Atlas</strong></td>
<td>Database and data storage</td>
</tr>

<tr>
<td><strong>Google Maps API</strong></td>
<td>Maps and location services</td>
</tr>

<tr>
<td><strong>JWT</strong></td>
<td>Authentication and authorization</td>
</tr>

<tr>
<td><strong>Mongoose</strong></td>
<td>MongoDB object modeling</td>
</tr>

<tr>
<td><strong>Axios</strong></td>
<td>Frontend–backend communication</td>
</tr>

</table>

---

## User Roles

| Role          | Responsibilities                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| **Passenger** | Track buses, view routes and stops, check arrival information, save favorite routes, and report issues |
| **Driver**    | Start shifts, view assigned routes, and share live GPS location                                        |
| **Admin**     | Manage routes, stops, announcements, and driver registrations                                          |

---

## Repository Statistics

<p align="center">

<img src="https://img.shields.io/github/stars/MuqaddasHaideri/tripTrack?style=for-the-badge&logo=github&logoColor=white&label=Stars" alt="Stars">

<img src="https://img.shields.io/github/forks/MuqaddasHaideri/tripTrack?style=for-the-badge&logo=github&logoColor=white&label=Forks" alt="Forks">

<img src="https://img.shields.io/github/commit-activity/y/MuqaddasHaideri/tripTrack?style=for-the-badge&logo=git&logoColor=white&label=Commits" alt="Commit Activity">

</p>

<p align="center">

<img src="https://img.shields.io/github/issues/MuqaddasHaideri/tripTrack?style=flat-square&logo=github&label=Issues">

<img src="https://img.shields.io/github/last-commit/MuqaddasHaideri/tripTrack?style=flat-square&logo=git&label=Last%20Commit">

<img src="https://img.shields.io/github/repo-size/MuqaddasHaideri/tripTrack?style=flat-square&label=Repository%20Size">

<img src="https://img.shields.io/github/languages/top/MuqaddasHaideri/tripTrack?style=flat-square&label=Top%20Language">

</p>

### Project Timeline

| Project Detail         | Information        |
| ---------------------- | ------------------ |
| **Project Started**    | June 2026          |
| **Development Period** | 2+ Months          |
| **Project Type**       | Final Year Project |
| **Platform**           | Mobile Application |
| **Backend**            | Deployed           |
| **Repository**         | GitHub             |

> The GitHub badges above automatically display the repository's current stars, forks, commit activity, issues, and other statistics.

---

## System Overview

```text
                         ┌─────────────────────┐
                         │      TRIPTRACK      │
                         │  Mobile Application │
                         └──────────┬──────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
       ┌─────────────┐       ┌─────────────┐       ┌─────────────┐
       │  Passenger  │       │   Driver    │       │    Admin    │
       └──────┬──────┘       └──────┬──────┘       └──────┬──────┘
              │                     │                     │
              └─────────────────────┼─────────────────────┘
                                    ▼
                         ┌─────────────────────┐
                         │    REST API /       │
                         │   Express Server    │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │    MongoDB Atlas    │
                         └─────────────────────┘
```

---

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/MuqaddasHaideri/tripTrack.git
cd tripTrack
```

### 2. Install Dependencies

Navigate to the frontend directory:

```bash
cd frontend
npm install
```

### 3. Start the Application

```bash
npx expo start
```

The application can be opened using an Android emulator, iOS simulator, or a compatible mobile device.

> **Note:** The TripTrack backend is already deployed, so local backend setup and environment-variable configuration are not required to run the application.

---

## Project Goal

TripTrack aims to improve the public transportation experience by providing passengers with **better visibility of bus locations and arrival information**, while giving drivers and administrators the tools required to manage the transportation system efficiently.

---

## Project Journey

TripTrack started as a Final Year Project in **June 2026** and evolved through continuous development, testing, debugging, feature implementation, and system refinement.

Over the development period, the project progressed from an initial concept into a complete mobile bus tracking solution with dedicated **Passenger, Driver, and Admin** functionality.

---

<p align="center">
  <strong>TripTrack</strong>
  <br>
  A smarter way to track your journey.
</p>

<p align="center">
  <sub>Built with React Native, Node.js, Express.js & MongoDB</sub>
</p>
