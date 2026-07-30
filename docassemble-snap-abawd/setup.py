"""Docassemble package for the SNAP ABAWD work rules screening.

Install on a Docassemble server through Package Management, pointing at the
repository this folder is published from.
"""

import os
from setuptools import setup, find_namespace_packages


def package_data(prefix, directory):
    """Every file under a data directory, as install-relative paths."""
    here = os.path.dirname(os.path.abspath(__file__))
    root = os.path.join(here, prefix, directory)
    out = []
    for base, _dirs, files in os.walk(root):
        rel = os.path.relpath(base, os.path.join(here, prefix))
        for name in files:
            if name.startswith('.'):
                continue
            out.append(os.path.join(rel, name).replace(os.sep, '/'))
    return out


setup(
    name='docassemble.MLRISnapAbawd',
    version='0.1.0',
    description=(
        'Screening for the Massachusetts DTA SNAP ABAWD work rules: whether the '
        'rules apply, whether an exemption applies, or whether there was good cause.'
    ),
    long_description=(
        'A port of the MLRI web screener. The decision logic in snap_abawd.py is '
        'verified against the original JavaScript implementation. The interview '
        'YAML has not yet been run on a Docassemble server. See README.md.'
    ),
    author='Massachusetts Law Reform Institute',
    license='MIT',
    url='https://www.masslegalhelp.org/',
    packages=find_namespace_packages(include=['docassemble.*']),
    install_requires=[],
    zip_safe=False,
    package_data={
        'docassemble.MLRISnapAbawd': package_data('docassemble/MLRISnapAbawd', 'data'),
    },
)
