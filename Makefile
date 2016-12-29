PREFIX ?= /opt/fluxbb-activity
INSTALLDIR = $(DESTDIR)$(PREFIX)/lib/fluxbb-activity

install:
	install -d "$(INSTALLDIR)"
	cp -r -- fluxbbactivity "$(INSTALLDIR)"/
	find "$(INSTALLDIR)" -type d -exec chmod 755 {} \+
	find "$(INSTALLDIR)" -type f -exec chmod go+r {} \+
