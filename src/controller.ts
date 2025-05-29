import { IController, IManySide, IOneSide } from "#interfaces.js";
import { manySideModel, oneSideModel } from "#models.js";
import { Request, Response, Router } from "express";
import mongoose from "mongoose";

export default class myController implements IController {
    public router = Router();
    private many = manySideModel;
    private one = oneSideModel;

    constructor() {
        // Exam routes:

        // One-side example routes:
        this.router.get("/api/xyzOne", this.getOneAll);
        this.router.post("/api/xyzOne", this.createOne);
        this.router.delete("/api/xyzOne/:id", this.deleteOne);
        this.router.delete("/api/xyzOne/transaction/:id", this.deleteOneWithTransaction);

        // Many-side example routes:
        this.router.get("/api/xyzMany", this.getManyAll);
        this.router.get("/api/xyzMany/:id", this.getManyById);
        this.router.get("/api/xyzMany/keyword/:keyword", this.getManyByKeyword);
        this.router.get("/api/xyzMany-Group-By", this.getGroupByExample);
        this.router.get(`/api/xyzMany/:offset/:limit/:sortingfield{/:filter}`, this.getManyPaginated);
        this.router.post("/api/xyzMany", this.createMany);
        this.router.patch("/api/xyzMany/:id", this.modifyManyPATCH);
        this.router.put("/api/xyzMany/:id", this.modifyManyPUT);
        this.router.delete("/api/xyzMany/:id", this.deleteMany);
    }

    private getOneAll = async (req: Request, res: Response) => {
        try {
            const data = await this.one.find();
            res.send(data);
        } catch (error: unknown) {
            if (error instanceof Error) {
                res.status(400).send({ message: error.message });
            } else {
                res.status(400).send({ message: "An unknown error occurred!!" });
            }
        }
    };

    private createOne = async (req: Request, res: Response) => {
        try {
            const body = req.body as IOneSide;
            let autoId = 1;
            const oneAll = await this.one.find();
            if (oneAll.length > 0) {
                autoId = Math.max(...oneAll.map(d => d._id as number)) + 1;
            }
            const createdDocument = new this.one({
                ...body,
                _id: autoId,
            });

            const savedDocument = await createdDocument.save();
            res.status(201).send(savedDocument);
        } catch (error: unknown) {
            if (error instanceof Error) {
                res.status(400).send({ message: error.message });
            } else {
                res.status(400).send({ message: "An unknown error occurred!!" });
            }
        }
    };

    private deleteOne = async (req: Request, res: Response) => {
        try {
            const id = req.params.id;
            const refDocuments = await this.many.findOne({ FK_neve: id });
            if (refDocuments) {
                res.status(403).send({ message: `Document with id ${id} has reference in manySide table!` });
            } else {
                const successResponse = await this.one.findByIdAndDelete(id);
                if (successResponse) {
                    res.sendStatus(204);
                } else {
                    res.status(404).send({ message: `Document with id ${id} not found!` });
                }
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                res.status(400).send({ message: error.message });
            } else {
                res.status(400).send({ message: "An unknown error occurred!!" });
            }
        }
    };

    private deleteOneWithTransaction = async (req: Request, res: Response) => {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const id = req.params.id;
            await this.one.findByIdAndDelete(id).session(session);
            await this.many.deleteMany({ FK_neve: id }).session(session);
            await session.commitTransaction();
            res.sendStatus(204);
        } catch (error: unknown) {
            await session.abortTransaction();
            if (error instanceof Error) {
                res.status(400).send({ message: error.message });
            } else {
                res.status(400).send({ message: "An unknown error occurred!!" });
            }
        } finally {
            await session.endSession();
        }
    };

    private createMany = async (req: Request, res: Response) => {
        try {
            const body = req.body as IManySide;
            const createdDocument = new this.many({
                ...body,
            });
            const savedDocument = await createdDocument.save();
            res.send(savedDocument);
        } catch (error: unknown) {
            if (error instanceof Error) {
                res.status(400).send({ message: error.message });
            } else {
                res.status(400).send({ message: "An unknown error occurred!!" });
            }
        }
    };

    private deleteMany = async (req: Request, res: Response) => {
        try {
            const id = req.params.id;
            const successResponse: IManySide | null = await this.many.findByIdAndDelete(id);
            if (successResponse) {
                res.sendStatus(200);
            } else {
                res.status(404).send({ message: `Document with id ${id} not found!` });
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                res.status(400).send({ message: error.message });
            } else {
                res.status(400).send({ message: "An unknown error occurred!!" });
            }
        }
    };

    private getManyAll = async (req: Request, res: Response) => {
        try {
            const data = await this.many.find().populate("FK_neve");
            // or:
            // const data = await this.many.find().populate("virtualPop");
            res.send(data);
        } catch (error: unknown) {
            if (error instanceof Error) {
                res.status(400).send({ message: error.message });
            } else {
                res.status(400).send({ message: "An unknown error occurred!!" });
            }
        }
    };

    private getManyById = async (req: Request, res: Response) => {
        try {
            const id = req.params.id;
            const document = await this.many.findById(id).populate("FK_neve", "-_id");
            if (document) {
                res.send(document);
            } else {
                res.status(404).send({ message: `Document with id ${id} not found!` });
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                res.status(400).send({ message: error.message });
            } else {
                res.status(400).send({ message: "An unknown error occurred!!" });
            }
        }
    };

    private getManyByKeyword = async (req: Request, res: Response) => {
        try {
            const myRegex = new RegExp(req.params.keyword, "i"); 


            const data = await this.many.aggregate([
                {
                    $lookup: { as: "as_FK_neve", foreignField: "_id", from: "TáblaNeveOne", localField: "FK_neve" },
                    
                },
                {
                    $match: { $or: [{ "as_FK_neve.field1": myRegex }, { description: myRegex }] },
                },
                {
                    $unwind: "$as_FK_neve",
                },
                { $project: { _id: 0, "as_FK_neve._id": 0, prepTime: 0 } },
            ]);
            res.send(data);
        } catch (error: unknown) {
            if (error instanceof Error) {
                res.status(400).send({ message: error.message });
            } else {
                res.status(400).send({ message: "An unknown error occurred!!" });
            }
        }
    };

    private getGroupByExample = async (req: Request, res: Response) => {
        try {
            const result = await manySideModel.aggregate([
                {
                    $lookup: {
                        from: "TáblaNeveOne", 
                        localField: "FK_neve", 
                        foreignField: "_id", 
                        as: "oneSideData", 
                    },
                },
                {
                    $unwind: "$oneSideData", 
                },
                {
                    $match: {
                        $and: [
                            { "oneSideData.field1": /alue/i }, 
                            { prepTime: { $gte: 10 } }, 
                        ],
                    },
                },
                {
                    $group: {
                        _id: "$oneSideData.field1", 
                        avgPrepTime: { $avg: "$prepTime" }, 
                        totalRecipes: { $sum: 1 }, 
                    },
                },
                {
                    $match: {
                        avgPrepTime: { $gte: 10 }, 
                    },
                },
                {
                    $sort: {
                        avgPrepTime: 1, 
                    },
                },
                {
                    $limit: 3, 
                },
                
                {
                    $project: {
                        _id: 0, 
                        field1Custom: "$_id", 
                        avgPrepTime: 1, 
                        totalRecipes: 1, 
                    },
                },
            ]);
            res.send(result);
        } catch (error: unknown) {
            if (error instanceof Error) {
                res.status(400).send({ message: error.message });
            } else {
                res.status(400).send({ message: "An unknown error occurred!!" });
            }
        }
    };

    private getManyPaginated = async (req: Request, res: Response) => {
        try {
            const offset = parseInt(req.params.offset);
            const limit = parseInt(req.params.limit);
            const sortingfield = req.params.sortingfield; 
            let paginatedData = [];
            let count = 0;
            if (req.params.filter != "") {
                const myRegex = new RegExp(req.params.filter, "i"); 
                count = await this.many.find({ $or: [{ name: myRegex }, { description: myRegex }] }).countDocuments();
                paginatedData = await this.many
                    .find({ $or: [{ name: myRegex }, { description: myRegex }] })
                    .sort(sortingfield)
                    .skip(offset)
                    .limit(limit);
            } else {
                count = await this.many.countDocuments();
                paginatedData = await this.many.find({}).sort(sortingfield).skip(offset).limit(limit);
            }
            res.append("x-total-count", `${count}`); 
            res.send(paginatedData);
        } catch (error: unknown) {
            if (error instanceof Error) {
                res.status(400).send({ message: error.message });
            } else {
                res.status(400).send({ message: "An unknown error occurred!!" });
            }
        }
    };

    private modifyManyPATCH = async (req: Request, res: Response) => {
        try {
            const id = req.params.id;
            const body = req.body as IManySide;
            const updatedDoc = await this.many
                .findByIdAndUpdate(id, body, { new: true, runValidators: true })
                .populate("FK_neve", "-_id");
            if (updatedDoc) {
                res.send(updatedDoc);
            } else {
                res.status(404).send({ message: `Document with id ${id} not found!` });
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                res.status(400).send({ message: error.message });
            } else {
                res.status(400).send({ message: "An unknown error occurred!!" });
            }
        }
    };

    private modifyManyPUT = async (req: Request, res: Response) => {
        try {
            const id = req.params.id;
            const body: IManySide = req.body as IManySide;
            const modificationResult = await this.many.replaceOne({ _id: id }, body, { runValidators: true });
            if (modificationResult.modifiedCount) {
                const updatedDoc = await this.many.findById(id).populate("FK_neve", "-_id");
                res.send(updatedDoc);
            } else {
                res.status(404).send({ message: `Document with id ${id} not found!` });
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                res.status(400).send({ message: error.message });
            } else {
                res.status(400).send({ message: "An unknown error occurred!!" });
            }
        }
    };
}
