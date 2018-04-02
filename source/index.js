/**
 * Created by mak.punyachokchai on 4/1/2018 AD.
 */

const _ = require('lodash');

let instance = null;

class RecalculatorHelper {
    constructor() {
        if (!instance) {
            instance = this;
        }
    }

    recalculate(result) {
        result.priceSummary = {
            originalPrice: 0,
            finalPrice: 0
        };

        _.each(result.samples, (sample) => {
            this._recalculateSample(sample);
            result.priceSummary.originalPrice += sample.priceSummary.originalPrice;
            result.priceSummary.finalPrice += sample.priceSummary.finalPrice;
        })
    }

    _recalculateSuggestedPetCombination(suggestedPetCombination) {
        let total = 0;

        // Rates
        total += _.sumBy(suggestedPetCombination.dailyRates, 'rate');

        // Weekday markups
        total += _.sumBy(suggestedPetCombination.weekdayMarkupDays, 'rate');

        // High season markups
        total += _.sumBy(suggestedPetCombination.highSeasonMarkupDays, 'rate');

        // Minimum paid nights markup
        total += suggestedPetCombination.minimumPaidNightsMarkup.rate;

        // Minimum night stay promotion
        total -= suggestedPetCombination.minimumNightStayPromotion;

        suggestedPetCombination.priceSummary = {
            originalPrice: total,
            finalPrice: total - suggestedPetCombination.minimumNightStayPromotion
        };
    }

    _recalculateSample(sample) {
        _.each(sample.suggestedPetCombinations, (suggestedPetCombination) => {
            this._recalculateSuggestedPetCombination(suggestedPetCombination);
        })

        _.each(sample.petOptions, (petOption) => {
            this._recalculatePetOption(petOption, sample.requestedPetCombination.totalPets);
         })

        const selectedSuggestedPetCombination = _.find(sample.suggestedPetCombinations, 'selected');

        const selectedPetOptions = _.filter(sample.petOptions, {selected: true});

        sample.priceSummary = {
            originalPrice: selectedSuggestedPetCombination.priceSummary.originalPrice + _.sumBy(selectedPetOptions, (selectedPetOption)=>{
                return selectedPetOption.priceSummary.originalPrice
            }),
            finalPrice: selectedSuggestedPetCombination.priceSummary.finalPrice + _.sumBy(selectedPetOptions, (selectedPetOption)=>{
                return selectedPetOption.priceSummary.finalPrice
            })
        };
    }

    _recalculatePetOption(petOption, totalPets) {
        let total = petOption.rate;
        switch (petOption.appliesEach) {
            case 'STAY':
                total *= 1;
                break;
            case 'DAY':
                const numberOfDaysSelected = _.filter(petOption.days, {selected: true}).length;
                total *= numberOfDaysSelected;
                break;
            default:
        }
        switch (petOption.appliesTo) {
            case 'ACCOMMODATION':
                total *= 1;
                break;
            case 'PET':
                total *= totalPets;
                break;
            default:
        }
        petOption.priceSummary = {
            originalPrice: total,
            finalPrice: total
        };
    }

    // _recalculateShuttleService() {
    //   return function (oneDirectionDistance, includesPickup, includesDelivery, shuttleService) {
    //     let kilometersLeft = oneDirectionDistance
    //     let temp = 0
    //     let total = 0
    //
    //     if (kilometersLeft > 0 && shuttleService.useWithinKilometersRate) {
    //       temp += shuttleService.withinKilometersRate
    //       kilometersLeft -= shuttleService.withinKilometers
    //     }
    //
    //     if (kilometersLeft > 0 && shuttleService.usePerKilometerRate) {
    //       temp += kilometersLeft * shuttleService.perKilometerRate
    //     }
    //
    //     if (includesPickup) {
    //       total += temp
    //     }
    //
    //     if (includesDelivery) {
    //       total += temp
    //     }
    //
    //     return total
    //   }
    // }
}

module.exports = RecalculatorHelper;
