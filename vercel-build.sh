#!/bin/bash

# Exit on error
set -e

# Install Python dependencies
python3.9 -m pip install --upgrade pip
python3.9 -m pip install -r api/python/requirements.txt 