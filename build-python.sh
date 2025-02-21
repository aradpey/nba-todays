#!/bin/bash

# Exit on error
set -e

# Create virtual environment
python3.9 -m venv .venv
source .venv/bin/activate

# Upgrade pip and install dependencies
python -m pip install --upgrade pip
pip install nba_api==1.4.1 pandas==2.1.4 numpy==1.26.3 requests==2.31.0 python-dotenv==1.0.0 --target ./api/python/

# Deactivate virtual environment
deactivate 