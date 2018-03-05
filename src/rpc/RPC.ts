/*
    WebMolKit

    (c) 2010-2018 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=webmolkit]
*/

///<reference path='../decl/jquery.d.ts'/>

namespace WebMolKit /* BOF */ {

/*
	RPC: remote procedure calls to the MolSync server, using its RESTful interface.

	Properties:
		request:   a string encoding the request function that will be invoked
		parameter: an arbitrary JavaScript object
		callback:  the function that will be called with the result, with the arguments:
						(result,error,rpc) ... result=undefined if failed; error=undefined if succeeded;
												 	  rpc=the object that was used to make the request

	Errors: when an RPC call fails for some reason, the callback function is given a defined 'error' parameter, which has
			the following parts:
		.message: a brief text message explaining what went wrong; can often get away with alert(error.message)
		.code: a numerical code for well defined errors, some of which may have a recovery pathway, e.g. token timeout
		.type: the fully specified Java class of the thrown error
		.detail: a long error message explaining exactly what went wrong and where
		
	Static properties:
		.ERRCODE_*: error codes that correspond to serverside failure situations (>=0) or client side (<0)
		.errorTypeHandlers: global handlers for certain types of errors; to add one, push an object with:
			{'code':#,'fcn':callback}
			where the callback function is expected to receive (result,error,rpc), just like the normal callback

	Note: before anything can happen, an external code block has to set the BASE_URL so that it points to an accessible
	server that hosts the MolSync RPC functionality.

	------------------------------

	Background: this class and its descendents originate from an earlier incarnation of the WebMolKit project, which
	employed tight coupling to a server. Due to massive improvements in the viability of the JavaScript runtime,
	this is no longer the best way to get work done for the most part, and so this approach is largely obsolete.
*/

export interface ErrorRPC
{
	message:string;
	code:number;
	type:number;
	detail:string;	
}

export class RPC
{
	// must be defined before any invocation; this is the URL where all of the standard resources can be found,
	// e.g. 'http://servername/MolSync'; the REST services hang off of this url: ${BASE_URL}/REST/...
	public static BASE_URL:string = null;

	// base for static resources that can be fetched without going through the RPC mechanism
	public static RESOURCE_URL:string = null;
	
	// commonly structured error codes; see com.mmi.server.wsvc.SyncException;
	public static ERRCODE_CLIENT_ABORTED = -3;
	public static ERRCODE_CLIENT_TIMEOUT = -1;
	public static ERRCODE_CLIENT_OTHER = -1;
	public static ERRCODE_NONSPECIFIC = 0;
	public static ERRCODE_UNKNOWN = 1;
	public static ERRCODE_NOSUCHUSER = 2;
	public static ERRCODE_INVALIDLOGIN = 3;
	public static ERRCODE_INVALIDTOKEN = 4;
	public static ERRCODE_DATASHEETUNAVAIL = 5;
	public static ERRCODE_INVALIDCOMMAND = 6;
	public static ERRCODE_ROWDATAUNAVAIL = 7;
	public static ERRCODE_MISSINGPARAM = 8;

	//molsync.RPC.errorTypeHandlers = [];

	constructor(private request:string, private parameter:Object, private callback:(result:any, error:ErrorRPC) => void) {}
	
	// send the request, associated with the given callback
	public invoke():void
	{
		let data = this.parameter;
		if (data == null) data = {};

		let url = RPC.BASE_URL + "/REST/" + this.request;
		
		$.ajax(
		{
			'url': url,
			'type': 'POST',
			'data': JSON.stringify(this.parameter),
			'contentType': 'application/json;charset=utf-8',
			'dataType': 'json',
			//async: true,
			headers: {'Access-Control-Allow-Origin': '*'},
			success: (data:any, textStatus:string, jqXHR:JQueryXHR) =>
			{
				var result:any = null, error:ErrorRPC = null;
				
				if (!data)
				{
					error =
					{
						'message': 'null result',
						'code': RPC.ERRCODE_NONSPECIFIC,
						type: 0,
						'detail': 'unknown failure'
					}; 
				}
				else
				{
					if (data.error)
					{
						error =
						{
							'message': data.error,
							'code': data.errorCode,
							'type': data.errorType,
							'detail': data.errorDetail
						};
						console.log('RPC error communicating with: ' + url + ', content: ' + JSON.stringify(data.error) + '\nDetail:\n' + data.errorDetail);
					}
					else result = data.result;
				}
				
				this.callback(result, error);
			},
			error: (jqXHR:JQueryXHR, textStatus:string, errorThrow:string) =>
			{
				var error:ErrorRPC = 
				{
					'message': 'connection failure',
					'code': RPC.ERRCODE_NONSPECIFIC,
					type: 0,
					'detail': `unable to obtain result from service: {$url}`
				}

				this.callback({}, error);
			}
		});		
	}
}

/* EOF */ }