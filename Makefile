dist:
	python3 setup.py sdist

clean:
	rm -rf ./*.egg-info

fluxbbactivity.1: fluxbbactivity.1.rst
	rst2man $< > $@


.PHONY: dist
