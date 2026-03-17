{\rtf1\ansi\ansicpg1252\cocoartf2759
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fmodern\fcharset0 Courier;}
{\colortbl;\red255\green255\blue255;\red0\green0\blue0;}
{\*\expandedcolortbl;;\cssrgb\c0\c0\c0;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\deftab720
\pard\pardeftab720\partightenfactor0

\f0\fs26 \cf0 \expnd0\expndtw0\kerning0
\outl0\strokewidth0 \strokec2 ---\
name: web-design-guidelines\
description: Review UI code for Web Interface Guidelines compliance. Use when asked to "review my UI", "check accessibility", "audit design", "review UX", or "check my site against best practices".\
metadata:\
  author: vercel\
  version: "1.0.0"\
  argument-hint: <file-or-pattern>\
---\
\
# Web Interface Guidelines\
\
Review files for compliance with Web Interface Guidelines.\
\
## How It Works\
\
1. Fetch the latest guidelines from the source URL below\
2. Read the specified files (or prompt user for files/pattern)\
3. Check against all rules in the fetched guidelines\
4. Output findings in the terse `file:line` format\
\
## Guidelines Source\
\
Fetch fresh guidelines before each review:\
\
```\
https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md\
```\
\
Use WebFetch to retrieve the latest rules. The fetched content contains all the rules and output format instructions.\
\
## Usage\
\
When a user provides a file or pattern argument:\
1. Fetch guidelines from the source URL above\
2. Read the specified files\
3. Apply all rules from the fetched guidelines\
4. Output findings using the format specified in the guidelines\
\
If no files specified, ask the user which files to review.\
}