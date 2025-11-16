            httpGet: function(e) {
                var t = new XMLHttpRequest,
                    n = new Sys.Deferred,
                    i = e.url;
					
					var mt='GET';
					
					if(i.indexOf('/server')!=-1){
					
                    mt='POST'; 
					
					}
					
                // Get token from localStorage
                var accessToken = localStorage.getItem('access_token');
                
                return i ? (t.onreadystatechange = function() {
                    4 === this.readyState && (t.onreadystatechange = function() {}, Sys.utils.httpRequestIsOK(t) ? "arraybuffer" !== e.responseType && Sys.isDefined(Sys.utils.getErrorCode(t)) ? n.rejectWith([t]) : n.resolveWith([t]) : n.rejectWith([t]))
                }, Sys.isDefined(e.onProgressCallback) && (t.onprogress = function(t) {
                    e.onProgressCallback(t, e.name)
                }), t.open(mt, i), 
                
                // Add authorization header if token exists
                accessToken && t.setRequestHeader('Authorization', 'Bearer ' + accessToken),
                
                Sys.isDefined(e.responseType) && (t.responseType = e.responseType), Sys.isEmpty(e.useCredentials) || (t.withCredentials = e.useCredentials), t.send(), n) : (n.resolveWith([null]), n)
            },