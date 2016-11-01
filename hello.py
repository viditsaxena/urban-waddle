#-------------------------------------------------------------------------------
# Name:        module1
# Purpose:
#
# Author:      zubair.zahiruddin
#
# Created:     25/08/2016
# Copyright:   (c) zubair.zahiruddin 2016
# Licence:     <your licence>
#-------------------------------------------------------------------------------

#from flask import Flask
from flask import Flask, session , render_template , url_for , request , flash , redirect , jsonify
from time import sleep

import requests, bs4, geocoder

#import api_for_tripadvisor

app = Flask(__name__)

def api_details(domainname,url):

	if (domainname == 'tripadvisor'):
		res = requests.get(url)
		#res.raise_for_status()
		noStarchSoup = bs4.BeautifulSoup(res.text,"lxml")

		#elems = noStarchSoup.select('.gridviewRow td')
		d = {};
		d['name'] = noStarchSoup.find("input", {"id": "name"}).get('value')
		d['phone'] = noStarchSoup.find("input", {"id": "phone"}).get('value')
		d['website'] = noStarchSoup.find("input", {"id": "website"}).get('value')
		d['street'] = noStarchSoup.find("input", {"id": "street"}).get('value')
		d['street2'] = noStarchSoup.find("input", {"id": "street2"}).get('value')
		d['postal'] = noStarchSoup.find("input", {"id": "postal"}).get('value')
		d['region'] = noStarchSoup.find("div", {"class": "worldName"}).getText()

		return d ;

	if (domainname == 'yelp'):
		res = requests.get(url)
		#res.raise_for_status()
		noStarchSoup = bs4.BeautifulSoup(res.text,"lxml")

		#elems = noStarchSoup.select('.gridviewRow td')
		d = {};
		try:
			d['name'] = noStarchSoup.find("h1", {"class": "biz-page-title embossed-text-white"}).getText().strip();
		except:

			d['name'] = noStarchSoup.find("h1", {"class": "biz-page-title embossed-text-white shortenough"}).getText().strip();

		try:
			d['phone'] = noStarchSoup.find("span", {"class": "biz-phone"}).getText().strip() if noStarchSoup.find("span", {"class": "biz-phone"}).getText() else '' ;
		except:
			d['phone'] = '' ;
		try:
			d['website'] = noStarchSoup.find("span", {"class": "biz-website js-add-url-tagging"}).getText().replace('Business website\n','').strip() if noStarchSoup.find("span", {"class": "biz-website js-add-url-tagging"}) else ''
		except:
			d['website']= '';
		try:
			d['street'] = noStarchSoup.find("span", {"itemprop": "streetAddress"}).getText().strip() if noStarchSoup.find("span", {"itemprop": "streetAddress"}) else ''
		except:
			d['street'] = '' ;
		try :
			d['street2'] = '' ;
		except:
			d['street2'] = '' ;
		try:
			d['postal'] = noStarchSoup.find("span", {"itemprop": "postalCode"}).getText().strip()
		except:
			d['postal'] = '' ;
		try:
			d['region'] = noStarchSoup.find("span", {"itemprop": "addressLocality"}).getText().strip()
		except:
			d['region'] = '' ;


		return d ;

	if(domainname =='lonelyplanet'):
		res = requests.get(url)
		#res.raise_for_status()
		noStarchSoup = bs4.BeautifulSoup(res.text,"lxml")

		d = {};
		d['name'] = noStarchSoup.find("h1", {"class": "copy--h1"}).getText().strip();
		d['phone'] = noStarchSoup.find("a", {"class": "tel"}).getText().strip() if (noStarchSoup.find("a", {"class": "tel"}))  else ''
		d['website'] = noStarchSoup.find("a", {"class": "break-text"}).getText().strip() if (noStarchSoup.find("a", {"class": "break-text"}) != 'Submit a correction')  else ''
		d['street'] = '' ;
		d['street2'] = '' ;
		d['postal'] = '' ;
		d['region'] = noStarchSoup.find("dd", {"class": "info-list__content copy--meta"}).getText().strip().split('\n')[0]

		return d ;

	if(domainname == 'general'):
		res = requests.get('http://google.com/search?q=tripadvisor' + ' ' + url)
		res.raise_for_status()
		soup = bs4.BeautifulSoup(res.text,"lxml")
		linkElems = soup.select('.r a')

		links= [];

		for link in linkElems:
			if 'Attraction_Review' in link.get('href'):
				links.append( (link.get('href')[7:link.get('href').index('html')+4]).replace("Attraction_Review","UpdateListing"));

		if len(links)>0:
			#return links[0] ;
			res = requests.get(links[0])
			#res.raise_for_status()
			noStarchSoup = bs4.BeautifulSoup(res.text,"lxml")

			#elems = noStarchSoup.select('.gridviewRow td')
			d = {};
			d['name'] = noStarchSoup.find("input", {"id": "name"}).get('value')
			d['phone'] = noStarchSoup.find("input", {"id": "phone"}).get('value')
			d['website'] = noStarchSoup.find("input", {"id": "website"}).get('value')
			d['street'] = noStarchSoup.find("input", {"id": "street"}).get('value')
			d['street2'] = noStarchSoup.find("input", {"id": "street2"}).get('value')
			d['postal'] = noStarchSoup.find("input", {"id": "postal"}).get('value')
			d['region'] = noStarchSoup.find("div", {"class": "worldName"}).getText()

			return d ;

		else :
			d ={};
			d['flag'] = 0 ;
			print d;
			return d ;



@app.route("/")
def hello():
    return "Hello World!"



@app.route('/unwander/<domainname>', methods = ['GET','POST'])
def unwander(domainname):
	url = request.args.get('url');
	result = api_details(domainname,url);
	#sleep(500000);
	return jsonify(result=result);

@app.route('/unwander/latlang/', methods = ['GET'])
def latlang():
   address = request.args.get('address')

   d ={};
   #geocoder.google('South Beach').latlng
#return jsonify(geocoder.google('South Beach').latlng);
   address_geocoding = address ;
   g =geocoder.google(address_geocoding);
   d['lat'] = g.latlng[0];
   d['lng'] = g.latlng[1];
   return jsonify(result=d);



if __name__ == '__main__':
	app.run(debug =True)
