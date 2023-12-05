.PHONY: setup build package publish

setup:
	yarn

build: setup
	yarn build
	LIB=cli yarn build

package: build
	yarn pack -f packed.tgz

publish: package
	yarn publish packed.tgz --access public
