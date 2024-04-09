import { Request, Response } from "express";
import user from "../model/user.model";
import { StatusCodes } from "http-status-codes";

const employeeList = async (req: Request, res: Response) => {
  try {
    // const emplpoyeeListData = await user.find({ registrationStatus: "all" });
    const emplpoyeeListData = await user
      .find(
        {
          registrationStatus: "verified",
        },
        { username: 1, name: 1 }
      )
      .sort({ createdAt: -1 });

    res
      .status(StatusCodes.OK)
      .json({ message: "Data fetched successfully", data: emplpoyeeListData });
  } catch (error: any) {
    res.status(StatusCodes.BAD_GATEWAY).json({ message: error.message });
  }
};

export { employeeList };

// /**
//  * @Type POST
//  * @Desc Reason datatable
//  */

// public datatableReason = async (
// 	req: Request,
// 	res: Response,
// 	next: NextFunction
// ): Promise<any> => {
// 	try {
// 		const rule = {
// 			page: "required|integer",
// 			limit: "required|integer",
// 			prouctType: "string",
// 			type: "string",
// 		};
// 		const reqData = Object.assign({}, req.body);
// 		if (this.validateRequest(reqData, rule)) {
// 			const page: number = reqData.page;
// 			const limit: number = reqData.limit;
// 			const start: number = page * limit - limit;
// 			const query: any = {};

// 			if (reqData.hasOwnProperty("prouctType")) {
// 				query.prouctType = reqData.prouctType;
// 			}
// 			if (reqData.hasOwnProperty("type")) {
// 				query.type = reqData.type;
// 			}

// 			const responseSet: any[] = await Promise.all([
// 				collections.reason?.countDocuments(
// 					Object.keys(query).length > 0 ? query : {}
// 				),
// 				collections.reason
// 					?.aggregate([
// 						{ $match: Object.keys(query).length > 0 ? query : {} },
// 						{ $skip: start },
// 						{ $limit: limit },
// 					])
// 					.toArray(),
// 			]);

// 			if (responseSet) {
// 				let totalRecords: number = responseSet[0] as number;
// 				let reasonDetails: any[] = responseSet[1];
// 				const response: Datatable = {
// 					check: true,
// 					count: totalRecords,
// 					data: reasonDetails,
// 				};

// 				return res.status(200).json(response);
// 			}
// 		}
// 	} catch (error: any) {
// 		next(error);
// 	}
// };

// /**
//  * @Type GET
//  * @Desc Producttype and Type by list
//  */

// public productTypeList = async (
// 	req: Request,
// 	res: Response,
// 	next: NextFunction
// ) => {
// 	try {
// 		const rule = {
// 			prouctType: "required|string",
// 			type: "required|string",
// 		};
// 		const reqData = req.query;

// 		if (this.validateRequest(reqData, rule)) {
// 			const result = await collections.reason
// 				?.aggregate([
// 					{
// 						$match: {
// 							prouctType: reqData.prouctType,
// 							type: reqData.type,
// 							isActive: true,
// 						},
// 					},
// 				])
// 				.toArray();

// 			if (result) {
// 				const response: ResponseModel = { check: true, data: result };
// 				return res.status(200).json(response);
// 			}
// 		}
// 	} catch (error: any) {
// 		next(error);
// 	}
// };

//pdf generator

// const htmlContent = getOrderPdfTemplate(
// 					orderDetails,
// 					transactionIdstring
// 				);
// 				const browser = await puppeteer.launch();
// 				const page = await browser.newPage();

// 				await page.setContent(htmlContent);

// 				const pdfBuffer = await page.pdf({ format: "A4" });

// 				await browser.close();
// 				const invoiceBaseFile: string =
// 					Buffer.from(pdfBuffer).toString("base64");
// 				// Send the PDF file to frontend
// 				res.contentType("application/string");
// 				res.send(invoiceBaseFile);
// 				// const file = fs.createReadStream(invoicePath);
// 				// res.setHeader("Content-Type", "application/pdf");
// 				// res.setHeader("Content-Disposition", "inline");
// 				// res.setHeader(
// 				// 	"Content-Disposition",
// 				// 	'inline; filename="' + invoicePath + '"'
// 				// );
// 				// file.pipe(res);
